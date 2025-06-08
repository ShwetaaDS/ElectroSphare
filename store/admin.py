from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import ChatMessage, CartItem, Order

admin.site.register(ChatMessage)
admin.site.register(CartItem)
admin.site.register(Order)
