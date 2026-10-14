from django.test import SimpleTestCase

from shop.services.discounts import normalize_discount_code
from shop.services.utils import slugify, validate_email


class ShopRulesTests(SimpleTestCase):
    def test_slugify_product_title(self):
        self.assertEqual(slugify("  Summer Oak Chair! "), "summer-oak-chair")

    def test_normalize_discount_code(self):
        self.assertEqual(normalize_discount_code("  save10 "), "SAVE10")

    def test_validate_email_domain(self):
        self.assertEqual(validate_email("ada@"), "Enter a valid email address")
