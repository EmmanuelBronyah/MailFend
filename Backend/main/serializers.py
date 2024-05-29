from rest_framework import serializers


class MessageIdSerializer(serializers.Serializer):
    action = serializers.CharField()
    message_id = serializers.CharField()


class MoveMessageSerializer(serializers.Serializer):
    action = serializers.CharField()
    message_id = serializers.CharField()
    mailbox = serializers.CharField()


class ComposeMessageSerializer(serializers.Serializer):
    action = serializers.CharField()
    message_data = serializers.JSONField()
