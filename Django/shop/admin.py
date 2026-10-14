from django.contrib import admin

from shop import models

admin.site.register(models.Category)
admin.site.register(models.Product)
admin.site.register(models.ProductVariant)
admin.site.register(models.Inventory)
admin.site.register(models.User)
admin.site.register(models.Order)
admin.site.register(models.Discount)
admin.site.register(models.Review)
admin.site.register(models.HomePagePromotion)
admin.site.register(models.SupportTicket)
