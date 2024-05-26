from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login-view"),
    path("oauth2callback/", views.RedirectView.as_view(), name="redirect-view"),
    path("main/", views.MainPageView.as_view(), name="main-page-view"),
    path("logout/", views.LogoutView.as_view(), name="logout-view"),
]
