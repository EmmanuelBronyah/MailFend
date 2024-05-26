from rest_framework import serializers


class MessageIdSerializer(serializers.Serializer):
    action = serializers.CharField()
    message_id = serializers.CharField()
