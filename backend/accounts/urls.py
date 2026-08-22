from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    StaffProfileListView,
    StaffProfileApprovalView,
)


urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "staff/",
        StaffProfileListView.as_view(),
        name="staff-list",
    ),

    path(
        "staff/<int:pk>/approval/",
        StaffProfileApprovalView.as_view(),
        name="staff-approval",
    ),
]