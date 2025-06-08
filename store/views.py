
from django.shortcuts import render
from django.contrib.auth import logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
import json
import re
from django.contrib.auth import authenticate
from .models import ChatMessage, CartItem, Order
from .serializers import (
    RegisterSerializer, UserSerializer,
    ChatMessageSerializer, CartItemSerializer, OrderSerializer
)
def home(request):
    return render(request, 'index.html')


import logging
logger = logging.getLogger(__name__)


# ----------------------
# REGISTER
# ----------------------
@api_view(['POST'])
def register(request):
    logger.debug('Register request received: data=%s', request.data)
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        logger.info('User registered: %s', user.username)
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
    logger.error('Registration errors: %s', serializer.errors)
    return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
# ----------------------
# LOGIN
# ----------------------

from django.contrib.auth import login as django_login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        django_login(request._request, user)  # ✅ Use `request._request` here
        return Response({'message': 'Login successful'})
    else:
        return Response({'error': 'Invalid credentials'}, status=400)

# ----------------------
# LOGOUT
# ----------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logger.debug('Logout request received: user=%s', request.user)
    logout(request)
    request.session.flush()
    logger.info('User logged out')
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

# ----------------------
# CHAT: Save & respond
# ----------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    import re
    user_message = request.data.get('message', '').lower()

    # 📦 Order & Returns
    if re.search(r'\b(track|status|order|shipping id|track number)\b', user_message):
        bot_reply = "You can track your order from the 'Orders' section using your order ID or tracking number."
    elif re.search(r'\b(cancel|cancellation)\b', user_message):
        bot_reply = "You can cancel your order within 30 minutes of placing it from your Orders page."
    elif re.search(r'\b(refund|return|money back)\b', user_message):
        bot_reply = "Refunds are processed within 5–7 business days after return approval. Go to 'Orders' > 'Request Refund'."

    # 💳 Payment
    elif re.search(r'\b(payment|method|card|upi|cod)\b', user_message):
        bot_reply = "We accept UPI, debit/credit cards, and cash on delivery (COD) for eligible items."

    # 🚚 Delivery
    elif re.search(r'\b(delivery|shipping|arrival|when will|how long)\b', user_message):
        bot_reply = "Standard delivery takes 3–5 days, and express shipping is available for 1–2 day delivery."

    # 🛍️ Products & Categories
    elif re.search(r'\b(product|categories|catalog|browse|shop)\b', user_message):
        bot_reply = "Explore our top categories: Smart TVs, Phones, Gaming Consoles, Laptops & Home Appliances. Visit the Products section to browse."

    # 🧾 Warranty & Support
    elif re.search(r'\b(warranty|guarantee|support|repair)\b', user_message):
        bot_reply = "All products come with a 1-year standard warranty. For repair or support, contact our Help Center."

    # 📞 Contact & Help
    elif re.search(r'\b(contact|help|support|email|phone)\b', user_message):
        bot_reply = "Need help? Email us at support@electrosphere.in or call +91 9557443131. We're here 9am–9pm, all days."

    # 👋 Greetings / General
    elif re.search(r'\b(hi|hello|hey|namaste|yo)\b', user_message):
        bot_reply = "Hi there! 👋 I’m ElectroBot. Ask me anything about your orders, deliveries, or our products."

    # ✨ Default fallback
    else:
        bot_reply = "I'm still learning 🤖, but I’ve sent your question to our support team. We'll get back to you shortly!"

    chat_entry = ChatMessage.objects.create(
        user=request.user,
        message=user_message,
        response=bot_reply
    )

    return Response(ChatMessageSerializer(chat_entry).data)



# ----------------------
# CART: Add/View/Delete items
# ----------------------
from django.views.decorators.csrf import ensure_csrf_cookie
@ensure_csrf_cookie
@api_view(['GET', 'POST', 'DELETE'])
def cart_view(request):
    logger.debug('Cart request received: method=%s, user=%s, headers=%s', 
                 request.method, request.user, dict(request.headers))
    if request.method == 'GET':
        if not request.user.is_authenticated:
            session_cart = request.session.get('cart', [])
            logger.info('Returning session cart: %s', session_cart)
            return Response(session_cart)
        items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        data = request.data.copy()
        logger.debug('Cart POST data: %s', data)
        if not request.user.is_authenticated:
            session_cart = request.session.get('cart', [])
            existing = next((item for item in session_cart if item['product_id'] == data['product_id']), None)
            if existing:
                existing['quantity'] += int(data.get('quantity', 1))
            else:
                session_cart.append({
                    'product_id': data['product_id'],
                    'name': data['name'],
                    'price': float(data['price']),
                    'quantity': int(data.get('quantity', 1)),
                    'image_url': data['image_url']
                })
            request.session['cart'] = session_cart
            request.session.modified = True
            logger.info('Session cart updated: %s', session_cart)
            return Response(session_cart, status=status.HTTP_200_OK)
        data['user'] = request.user.id
        existing = CartItem.objects.filter(user=request.user, product_id=data['product_id']).first()
        if existing:
            existing.quantity += int(data.get('quantity', 1))
            existing.save()
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
        serializer = CartItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error('Cart serializer errors: %s', serializer.errors)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        product_id = request.query_params.get('product_id')
        logger.debug('Cart DELETE: product_id=%s', product_id)
        if not request.user.is_authenticated:
            session_cart = request.session.get('cart', [])
            session_cart = [item for item in session_cart if item['product_id'] != product_id]
            request.session['cart'] = session_cart
            request.session.modified = True
            logger.info('Session cart updated after delete: %s', session_cart)
            return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)
        if product_id:
            item = CartItem.objects.filter(user=request.user, product_id=product_id).first()
            if item:
                item.delete()
                logger.info('Cart item deleted: product_id=%s', product_id)
                return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)
            logger.error('Cart item not found: product_id=%s', product_id)
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            CartItem.objects.filter(user=request.user).delete()
            logger.info('Cart cleared for user: %s', request.user)
            return Response({'message': 'Cart cleared successfully'}, status=status.HTTP_200_OK)
# ----------------------
# ORDERS: View or Place
# ----------------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.method == 'GET':
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        cart_items = CartItem.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        items_data = [
            {
                'product_id': item.product_id,
                'name': item.name,
                'quantity': item.quantity,
                'price': float(item.price),
                'image_url': item.image_url
            }
            for item in cart_items
        ]
        total_price = sum(item['price'] * item['quantity'] for item in items_data)

        order = Order.objects.create(
            user=request.user,
            items=str(items_data),
            total=total_price,
            status='PENDING'
        )

        cart_items.delete()

        return Response(OrderSerializer(order).data, status=201)
@csrf_exempt
def chat_reply(request):
    if request.method == "POST":
        data = json.loads(request.body)
        msg = data.get("message", "").lower()

        if re.search(r'\b(products|items|catalog|available)\b', msg):
            reply = "We offer a wide range of electronics like phones, laptops, and smart gadgets."
        elif re.search(r'\b(track|order|status)\b', msg):
            reply = "Please provide your order ID to track your order."
        elif re.search(r'\b(hi|hello|hey|hii)\b', msg):
            reply = "Hi! How can I help you today?"
        else:
            reply = "Thanks for reaching out! Our team will contact you shortly."

        return JsonResponse({"response": reply})