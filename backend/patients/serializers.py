from rest_framework import serializers
from .models import Patient, WoundAssessment


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"


class WoundAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WoundAssessment
        fields = "__all__"