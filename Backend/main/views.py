import os
from django.shortcuts import redirect
from django.contrib.auth import logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.exceptions import RefreshError
import requests
from google.auth.exceptions import DefaultCredentialsError, RefreshError, TransportError
import httplib2
import socket
import base64
import quopri

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

        return redirect("https://localhost:5173/main")


class MainPageView(APIView):

    @staticmethod
    def refresh_token(credentials):
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

    def parse_parts(self, parts, message_id, service, message_object):
        body_as_html = ""
        body_as_text = ""

        for part in parts:
            if part.get("parts"):
                self.parse_parts(part["parts"], message_id, service, message_object)
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
                    attachment = (
                        service.users()
                        .messages()
                        .attachments()
                        .get(userId="me", messageId=message_id, id=attachment_id)
                        .execute()
                    )
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

    def fetch_emails(self, service, mailbox):
        messages = []

        results = (
            service.users()
            .messages()
            .list(userId="me", labelIds=[mailbox])
            .execute()
        )
        message_data = results.get("messages")
        if message_data:
            for data in message_data:
                message_object = {
                    "Id": "",
                    "From": "",
                    "To": "",
                    "Subject": "",
                    "Date": "",
                    "Body": "",
                    "UNREAD": False,
                    "Attachments": [],
                }

                message_id = data.get("id")
                print(message_id)
                message_object["Id"] = message_id

                message = (
                    service.users().messages().get(userId="me", id=message_id).execute()
                )
                message_object["UNREAD"] = "UNREAD" in message.get("labelIds")

                headers = message["payload"]["headers"]
                for header in headers:
                    if message_object.get(header["name"]) is not None:
                        message_object[header["name"]] = header["value"]

                parts = message["payload"].get("parts")
                if parts:
                    updated_message_object = self.parse_parts(
                        parts, message_id, service, message_object
                    )
                    messages.append(updated_message_object)
                else:
                    try:
                        charset, encoding = self.get_charset_and_encoding(headers)

                        body_data = message["payload"]["body"]["data"]

                        decoded_body = self.get_decoded_body(
                            body_data, charset, encoding
                        )

                        message_object["Body"] = decoded_body
                        messages.append(message_object)

                    except (UnicodeDecodeError, base64.binascii.Error) as e:
                        print(
                            f"Failed to decode email body using {charset} with encoding {encoding}. Error: {e}"
                        )
                        body = base64.urlsafe_b64decode(body_data).decode(
                            "iso-8859-1", errors="replace"
                        )
                        message_object["Body"] = body
                        messages.append(message_object)

            return messages

        return None

    @staticmethod
    def get_user_profile(service):
        profile = service.users().getProfile(userId="me").execute()
        return profile
    
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
    
    def get(self, request, *args, **kwargs):        
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
                profile = self.get_user_profile(service)
                return Response({"res": profile}, status=status.HTTP_200_OK)
            case "fetch_emails":
                mailbox_unique = ["forums", "updates", "personal", "promotions", "social", "bin"]
                mailbox = request.GET.get("mailbox")
                mailbox = self.get_mailbox_name(mailbox) if mailbox.lower() in mailbox_unique else mailbox.upper()
                messages = self.fetch_emails(service, mailbox)
                
                return (
                    Response({"res": messages}, status=status.HTTP_200_OK)
                    if messages
                    else Response({"res": "No emails in mailbox."}, status=status.HTTP_200_OK)
                )


class LogoutView(APIView):

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"res": "Successfully logged out."}, status=status.HTTP_200_OK)
