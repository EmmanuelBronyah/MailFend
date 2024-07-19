import os
import time
import socket
import base64
import quopri
import asyncio
import httplib2
from datetime import datetime
from dateutil import parser
import mimetypes
from email import policy
from rest_framework import status
from django.core.cache import cache
from email.parser import BytesParser
from django.shortcuts import redirect
from email.message import EmailMessage
from django.contrib.auth import logout
from requests.exceptions import Timeout
from rest_framework.views import APIView
from requests.adapters import HTTPAdapter
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from rest_framework.response import Response
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
# from .voice_command_processor import text_processor
from asgiref.sync import sync_to_async, async_to_sync
from google.auth.exceptions import DefaultCredentialsError, RefreshError, TransportError
from .serializers import (
    MessageIdSerializer,
    MarkMessageSerializer,
    ComposeMessageSerializer,
    VoiceTextSerializer,
)

current_directory = os.path.dirname(__file__)
credentials_file_path = os.path.join(current_directory, "credentials.json")

SCOPES = ["https://mail.google.com/"]


class LoginView(APIView):

    def get(self, request, *args, **kwargs):
        redirect_uri = "https://localhost:8000/api/oauth2callback"
        flow = Flow.from_client_secrets_file(
            credentials_file_path, scopes=SCOPES, redirect_uri=redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true"
        )
        request.session["state"] = state

        return Response({"auth_url": authorization_url}, status=status.HTTP_200_OK)


class RedirectView(APIView):

    def get(self, request, *args, **kwargs):
        redirect_uri = "https://localhost:8000/api/oauth2callback"
        state = request.session.get("state")
        flow = Flow.from_client_secrets_file(
            credentials_file_path, scopes=SCOPES, redirect_uri=redirect_uri
        )
        flow.fetch_token(authorization_response=request.build_absolute_uri())
        credentials = flow.credentials
        request.session["credentials"] = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

        return redirect("https://localhost:5173/home")


class MainPageView(APIView):
    message_id_serializer_class = MessageIdSerializer
    mark_message_serializer_class = MarkMessageSerializer
    compose_message_serializer_class = ComposeMessageSerializer
    voice_text_serializer_class = VoiceTextSerializer

    @staticmethod
    def refresh_token(credentials):
        print("REFRESHING CREDENTIALS")
        credentials = Credentials(
            token=credentials["token"],
            refresh_token=credentials["refresh_token"],
            token_uri=credentials["token_uri"],
            client_id=credentials["client_id"],
            client_secret=credentials["client_secret"],
            scopes=credentials["scopes"],
        )
        credentials.refresh(Request())
        credentials["token"] = credentials.token

        return credentials

    @staticmethod
    async def get_user_profile(service):
        profile = await sync_to_async(service.users().getProfile(userId="me").execute)()
        return profile

    @staticmethod
    def get_charset_and_encoding(headers):
        charset = "utf-8"
        encoding = "base64"
        for header in headers:
            if header["name"].lower() == "content-type":
                value = header["value"].split(";")
                if len(value) > 1:
                    charset_part = value[1].strip()
                    if "charset=" in charset_part:
                        charset = charset_part.split("=")[1].strip()
            elif header["name"].lower() == "content-transfer-encoding":
                encoding = header["value"].strip().lower()

        return charset, encoding

    @staticmethod
    def get_decoded_body(body_data, charset, encoding):
        decoded_body = base64.urlsafe_b64decode(body_data)

        if encoding == "quoted-printable":
            decoded_body = quopri.decodestring(decoded_body).decode(
                charset, errors="replace"
            )
        else:
            decoded_body = decoded_body.decode(charset, errors="replace")

        return decoded_body

    async def parse_parts(self, parts, message_id, service, message_object):
        body_as_html = ""
        body_as_text = ""

        for part in parts:
            if part.get("parts"):
                await self.parse_parts(
                    part["parts"], message_id, service, message_object
                )
            else:
                mime_type = part.get("mimeType")
                body_data = part.get("body", {}).get("data")
                attachment_id = part.get("body", {}).get("attachmentId")
                headers = part.get("headers", [])

                charset, encoding = self.get_charset_and_encoding(headers)

                if body_data:
                    try:
                        decoded_body = self.get_decoded_body(
                            body_data, charset, encoding
                        )

                        if mime_type == "text/plain":
                            body_as_text = decoded_body
                        elif mime_type == "text/html":
                            body_as_html = decoded_body

                    except (UnicodeDecodeError, base64.binascii.Error) as e:
                        print(
                            f"Failed to decode body using {charset} with encoding {encoding}. Error: {e}"
                        )
                        body_as_text = base64.urlsafe_b64decode(body_data).decode(
                            "iso-8859-1", errors="replace"
                        )

                elif attachment_id:
                    attachment_object = {"Id": "", "Filename": "", "Data": None}
                    attachment = await sync_to_async(
                        service.users()
                        .messages()
                        .attachments()
                        .get(userId="me", messageId=message_id, id=attachment_id)
                        .execute
                    )()
                    attachment_data = base64.urlsafe_b64decode(attachment["data"])
                    filename = part.get("filename")

                    attachment_object["Id"] = attachment_id
                    attachment_object["Filename"] = filename
                    attachment_object["Data"] = base64.b64encode(
                        attachment_data
                    ).decode("utf-8")

                    message_object["Attachments"].append(attachment_object)

        message_object["Body"] = body_as_html if body_as_html else body_as_text

        return message_object

    @staticmethod
    def get_mailbox_name(mailbox):
        match mailbox.lower():
            case "forums":
                mailbox = "CATEGORY_FORUMS"
                return mailbox
            case "updates":
                mailbox = "CATEGORY_UPDATES"
                return mailbox
            case "personal":
                mailbox = "CATEGORY_PERSONAL"
                return mailbox
            case "promotions":
                mailbox = "CATEGORY_PROMOTIONS"
                return mailbox
            case "social":
                mailbox = "CATEGORY_SOCIAL"
                return mailbox
            case "bin":
                mailbox = "TRASH"
                return mailbox

    async def fetch_email(self, service, message_id):
        cached_email = cache.get(message_id)
        if cached_email:
            print("EMAIL WAS CACHED")
            return cached_email

        message_object = {
            "Id": message_id,
            "Message-ID": "",
            "Thread-ID": "",
            "From": "",
            "To": "",
            "Subject": "",
            "Date": "",
            "Body": "",
            "References": "",
            "UNREAD": False,
            "Attachments": [],
        }

        message = await sync_to_async(
            service.users().messages().get(userId="me", id=message_id).execute
        )()
        message_object["Thread-ID"] = message.get("threadId")
        message_object["UNREAD"] = "UNREAD" in message.get("labelIds", [])

        headers = message.get("payload", {}).get("headers", [])
        for header in headers:
            if header["name"] in message_object:
                message_object[header["name"]] = header["value"]

        parts = message.get("payload", {}).get("parts")
        if parts:
            updated_message_object = await self.parse_parts(
                parts, message_id, service, message_object
            )
            cache.set(
                message_id, updated_message_object, timeout=None
            )  # No timeout for indefinite caching
            return updated_message_object
        else:
            try:
                charset, encoding = self.get_charset_and_encoding(headers)
                body_data = message["payload"]["body"]["data"]
                decoded_body = self.get_decoded_body(body_data, charset, encoding)
                message_object["Body"] = decoded_body
            except (UnicodeDecodeError, base64.binascii.Error) as e:
                print(
                    f"Failed to decode email body using {charset} with encoding {encoding}. Error: {e}"
                )
                body = base64.urlsafe_b64decode(body_data).decode(
                    "iso-8859-1", errors="replace"
                )
                message_object["Body"] = body
            cache.set(message_id, message_object, timeout=None)  # No timeout for indefinite caching
            return message_object

    async def fetch_emails(
        self,
        service,
        mailbox,
        q=None,
        max_results=10,
        page_token=None,
        after_timestamp=None,
    ):
        all_emails = []
        next_page_token = page_token

        while True:
            query = q or ""
            if after_timestamp:
                query += f" after:{after_timestamp}"

            request = (
                service.users()
                .messages()
                .list(
                    userId="me",
                    labelIds=[mailbox],
                    q=query,
                    maxResults=max_results,
                    pageToken=next_page_token,
                )
            )
            results = await sync_to_async(request.execute)()
            message_data = results.get("messages", [])
            if not message_data:
                break  # No messages found, break out of the loop

            next_page_token = results.get("nextPageToken")
            print(f"Fetched {len(message_data)} messages for mailbox: {mailbox}")
            tasks = [self.fetch_email(service, data.get("id")) for data in message_data]
            messages = await asyncio.gather(*tasks)
            all_emails.extend(messages)

            if not next_page_token:
                break

        return all_emails, next_page_token

    async def handle_get(self, request, *args, **kwargs):
        if "credentials" not in request.session:
            print("Credentials not in request session")
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        credentials = request.session["credentials"]
        credentials = Credentials(**credentials)

        if not credentials.valid:
            if all([credentials.expired, credentials.refresh_token]):
                credentials = self.refresh_token(credentials)
                request.session["credentials"] = credentials

        service = build("gmail", "v1", credentials=credentials)

        action = request.GET.get("action")
        match action:
            case "get_profile":
                profile = await self.get_user_profile(service)
                return Response({"res": profile}, status=status.HTTP_200_OK)
            case "fetch_emails":
                mailbox_unique = [
                    "forums",
                    "updates",
                    "personal",
                    "promotions",
                    "social",
                    "bin",
                ]
                mailbox = request.GET.get("mailbox")
                mailbox = (
                    self.get_mailbox_name(mailbox)
                    if mailbox.lower() in mailbox_unique
                    else mailbox.upper()
                )
                cache_key = f"mailfetch_{mailbox}_emails"
                print(f"CACHED KEY -> {cache_key}")
                cached_emails = cache.get(cache_key) or []
                if cached_emails:
                    print("Returning cached emails")

                # Extract the most recent timestamp from the cached emails
                last_fetched_time = (
                    max([email["Date"] for email in cached_emails])
                    if cached_emails
                    else None
                )
                print(f"Last fetched time -> {last_fetched_time}")
                after_timestamp = (
                    int(time.mktime(parser.parse(last_fetched_time).timetuple()))
                    if last_fetched_time
                    else None
                )
                print(f"After timestamp -> {after_timestamp}")
                q = request.GET.get("q")
                max_results = int(request.GET.get("max_results", 10))
                page_token = request.GET.get("page_token", None)
                print(f"Fetching emails from mailbox: {mailbox}")
                messages, next_page_token = await self.fetch_emails(
                    service, mailbox, q, max_results, page_token, after_timestamp
                )

                if not messages and not cached_emails:
                    return Response(
                        {"res": "No emails in mailbox."}, status=status.HTTP_200_OK
                    )

                # Append new messages to the cache and ensure they are sorted by date
                new_email_ids = {email["Id"] for email in messages}
                combined_emails = [
                    email for email in cached_emails if email["Id"] not in new_email_ids
                ] + messages

                # Sort emails by date in descending order
                combined_emails.sort(
                    key=lambda x: parser.parse(x["Date"]), reverse=True
                )

                cache.set(
                    cache_key, combined_emails, timeout=None
                )  # Cache indefinitely
                return Response(
                    {"res": combined_emails, "next_page_token": next_page_token},
                    status=status.HTTP_200_OK,
                )

    def get(self, request, *args, **kwargs):
        return async_to_sync(self.handle_get)(request, *args, **kwargs)

    @staticmethod
    async def forward_message(service, message_id, to, message, attachments):
        original_message = await sync_to_async(
            service.users()
            .messages()
            .get(userId="me", id=message_id, format="raw")
            .execute
        )()
        original_message_bytes = base64.urlsafe_b64decode(
            original_message["raw"].encode("ASCII")
        )

        original_message_to_send = BytesParser(policy=default).parsebytes(
            original_message_bytes
        )

        forward_message = EmailMessage()
        forward_message["To"] = to
        forward_message["Subject"] = f'Fwd: {original_message["snippet"]}'
        forward_message["From"] = "ykwesi054@gmail.com"
        forward_message.set_content(
            f'{message} \n\n {original_message_to_send.get_body(preferencelist=("plain")).get_content()}'
        )

        if original_message_to_send.get_body(preferencelist=("html")):
            forward_message.add_alternative(
                f'{message} <br><br> {original_message_to_send.get_body(preferencelist=("html")).get_content()}',
                subtype="html",
            )

        if attachments:
            for attachment in attachments:
                mime_type, _ = mimetypes.guess_type(attachment["filename"])
                if mime_type is None:
                    mime_type = "application/octet-stream"
                main_type, sub_type = mime_type.split("/", 1)
                content = base64.urlsafe_b64decode(attachment["content"])
                forward_message.add_attachment(
                    content,
                    maintype=main_type,
                    subtype=sub_type,
                    filename=attachment["filename"],
                )

        forward_raw_message = base64.urlsafe_b64encode(
            forward_message.as_bytes()
        ).decode("utf-8")
        message_body = {"raw": forward_raw_message}

        await sync_to_async(
            service.users().messages().send(userId="me", body=message_body).execute
        )()
        return "Message forwarded successfully."

    @staticmethod
    async def create_reply(
        service,
        sender,
        subject,
        to,
        message,
        thread_id,
        in_reply_to,
        references,
        attachments,
    ):
        email_message = EmailMessage()

        email_message["From"] = sender
        email_message["Subject"] = subject
        email_message["To"] = to
        email_message["In-Reply-To"] = in_reply_to
        email_message["References"] = references
        email_message.set_content(message)

        if attachments:
            for attachment in attachments:
                mime_type, _ = mimetypes.guess_type(attachment["filename"])
                if mime_type is None:
                    mime_type = "application/octet-stream"

                main_type, sub_type = mime_type.split("/", 1)
                content = base64.urlsafe_b64decode(attachment["content"])
                email_message.add_attachment(
                    content,
                    maintype=main_type,
                    subtype=sub_type,
                    filename=attachment["filename"],
                )
        raw_message = base64.urlsafe_b64encode(email_message.as_bytes()).decode()
        message_body = {"raw": raw_message, "threadId": thread_id}
        await sync_to_async(
            service.users().messages().send(userId="me", body=message_body).execute
        )()

        return f"Message sent successfully."

    @staticmethod
    async def compose_message(service, subject, to, body, attachments=None):
        message = EmailMessage()

        message["Subject"] = subject
        message["To"] = to
        message.set_content(body)

        if attachments:
            for attachment in attachments:
                mime_type, _ = mimetypes.guess_type(attachment["filename"])
                if mime_type is None:
                    mime_type = "application/octet-stream"

                main_type, sub_type = mime_type.split("/", 1)
                content = base64.urlsafe_b64decode(attachment["content"])
                message.add_attachment(
                    content,
                    maintype=main_type,
                    subtype=sub_type,
                    filename=attachment["filename"],
                )
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        await sync_to_async(
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw_message})
            .execute
        )()
        return f"Message sent successfully."

    @staticmethod
    async def unmark_message(service, message_id, mailbox):
        await sync_to_async(
            service.users()
            .messages()
            .modify(userId="me", id=message_id, body={"addLabelIds": [mailbox]})
            .execute
        )()
        return f"Message moved to the {mailbox} mailbox."

    @staticmethod
    async def mark_message(service, message_id, mailbox):
        await sync_to_async(
            service.users()
            .messages()
            .modify(userId="me", id=message_id, body={"addLabelIds": [mailbox]})
            .execute
        )()
        return f"Message moved to the {mailbox} mailbox."

    @staticmethod
    async def trash_message(service, message_id):
        await sync_to_async(
            service.users().messages().trash(userId="me", id=message_id).execute
        )()
        return f"Message moved to TRASH."

    @staticmethod
    async def create_draft(service, message_id):
        message = await sync_to_async(
            service.users()
            .messages()
            .get(userId="me", id=message_id, format="raw")
            .execute
        )()
        raw_message = message["raw"]
        draft = {"message": {"raw": raw_message}}
        await sync_to_async(
            service.users().drafts().create(userId="me", body=draft).execute
        )()
        return f"Message moved to the Draft mailbox."

    @staticmethod
    async def mark_as_unread(service, message_id):
        await sync_to_async(
            service.users()
            .messages()
            .modify(userId="me", id=message_id, body={"addLabelIds": ["UNREAD"]})
            .execute
        )()
        return "Message marked as unread."

    @staticmethod
    async def mark_as_read(service, message_id):
        await sync_to_async(
            service.users()
            .messages()
            .modify(userId="me", id=message_id, body={"removeLabelIds": ["UNREAD"]})
            .execute
        )()
        return "Message marked as read."

    async def handle_post(self, request, *args, **kwargs):
        if "credentials" not in request.session:
            print("Credentials not in request session")
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        credentials = request.session["credentials"]
        credentials = Credentials(**credentials)

        if not credentials.valid:
            if all([credentials.expired, credentials.refresh_token]):
                credentials = self.refresh_token(credentials)
                request.session["credentials"] = credentials

        service = build("gmail", "v1", credentials=credentials)

        action = request.data.get("action")
        match action:
            # case "speech":
            #     serializer = self.voice_text_serializer_class(data=request.data)
            #     if serializer.is_valid():
            #         voice_text = serializer.validated_data["voice_text"]
            #         response = text_processor(voice_text)
            #         return Response({"res": response}, status=status.HTTP_200_OK)
            case "mark_as_read":
                serializer = self.message_id_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    response = self.mark_as_read(service, message_id)
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "mark_as_unread":
                serializer = self.message_id_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    response = self.mark_as_unread(service, message_id)
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "create_draft":
                serializer = self.mark_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    response = self.create_draft(service, message_id)
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "mark_message":
                serializer = self.mark_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    mailbox = serializer.validated_data["mailbox"]
                    mailbox_unique = [
                        "forums",
                        "updates",
                        "personal",
                        "promotions",
                        "social",
                        "bin",
                    ]
                    mailbox = (
                        self.get_mailbox_name(mailbox)
                        if mailbox.lower() in mailbox_unique
                        else mailbox.upper()
                    )
                    response = self.mark_message(service, message_id, mailbox)
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "unmark_message":
                serializer = self.mark_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    mailbox = serializer.validated_data["mailbox"]
                    mailbox_unique = [
                        "forums",
                        "updates",
                        "personal",
                        "promotions",
                        "social",
                        "bin",
                    ]
                    mailbox = (
                        self.get_mailbox_name(mailbox)
                        if mailbox.lower() in mailbox_unique
                        else mailbox.upper()
                    )
                    response = self.unmark_message(service, message_id, mailbox)
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "trash_message":
                serializer = self.message_id_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    response = await sync_to_async(
                        service.users()
                        .messages()
                        .trash(userId="me", id=message_id)
                        .execute
                    )()
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "forward_message":
                serializer = self.compose_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    message_id = serializer.validated_data["message_id"]
                    to = serializer.validated_data["to"]
                    message = serializer.validated_data["message"]
                    attachments = serializer.validated_data.get("attachments", [])
                    response = await self.forward_message(
                        service, message_id, to, message, attachments
                    )
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "create_reply":
                serializer = self.compose_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    sender = "ykwesi054@gmail.com"
                    subject = serializer.validated_data["subject"]
                    to = serializer.validated_data["to"]
                    message = serializer.validated_data["message"]
                    thread_id = serializer.validated_data["thread_id"]
                    in_reply_to = serializer.validated_data["in_reply_to"]
                    references = serializer.validated_data["references"]
                    attachments = serializer.validated_data.get("attachments", [])
                    response = await self.create_reply(
                        service,
                        sender,
                        subject,
                        to,
                        message,
                        thread_id,
                        in_reply_to,
                        references,
                        attachments,
                    )
                    return Response({"res": response}, status=status.HTTP_200_OK)
            case "compose_message":
                serializer = self.compose_message_serializer_class(data=request.data)
                if serializer.is_valid():
                    subject = serializer.validated_data["message_data"]["Subject"]
                    to = serializer.validated_data["message_data"]["To"]
                    body = serializer.validated_data["message_data"]["Body"]
                    attachments = serializer.validated_data["message_data"].get("attachments", [])
                    response = await self.compose_message(
                        service, subject, to, body, attachments
                    )
                    return Response({"res": response}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        return async_to_sync(self.handle_post)(request, *args, **kwargs)


class LogoutView(APIView):

    def post(self, request, *args, **kwargs):
        # cache.clear()
        logout(request)
        return Response({"res": "Successfully logged out."}, status=status.HTTP_200_OK)
