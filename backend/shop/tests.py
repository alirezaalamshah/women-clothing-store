# from django.test import TestCase

# # Create your tests here.



from shop.models import Product, Discount

for discount in Discount.objects.all():
    product = discount.product
    if not product.timed_discount:
        product.timed_discount = {
            'start_date': discount.start_date,
            'end_date': discount.end_date,
            'percentage': float(discount.percentage)
        }
    product.save()
Discount.objects.all().delete()