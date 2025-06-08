from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('chat/', views.chat),
    path('cart/', views.cart_view),
    path('orders/', views.orders),
    path('api/cart/', views.cart_view, name='cart'),
    path('api/login/', views.login_view, name='api-login'),
]
