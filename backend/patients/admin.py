# Register your models here.
from django.contrib import admin
from .models import Patient, WoundAssessment

admin.site.register(Patient)
admin.site.register(WoundAssessment)