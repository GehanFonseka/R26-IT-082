import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from recipient import recipients
from recipient_layout import recipient_layout_text
from recipient_roles import is_non_recipient


class RecipientTests(unittest.TestCase):
    def test_linkedin_recipient_label_without_colon(self):
        text = "Certificate recipient\nASHAN NIRMAL\nCourse completed\nEthics in the Age of Generative AI"
        self.assertEqual(recipients(text), ["ASHAN NIRMAL"])
        self.assertEqual(recipients("Course completed by ASHAN NIRMAL"), ["ASHAN NIRMAL"])

    def test_udemy_recipient_label_preserves_initials(self):
        text = "Certificate Recipient:\nS.D Ashan Nirmal Wimalarathna\nAbout the Course:\nBluelime Learning Solutions"
        self.assertEqual(recipients(text), ["S.D Ashan Nirmal Wimalarathna"])

    def test_course_author_cannot_be_treated_as_certificate_recipient(self):
        text = "Certificate recipient\nASHAN NIRMAL\nCourse\nBy: Vilas Dhar"
        self.assertTrue(is_non_recipient("Vilas Dhar", text))
        self.assertFalse(is_non_recipient("ASHAN NIRMAL", text))
        self.assertFalse(is_non_recipient("Vilas Dhar", text + "\nCertificate recipient: Vilas Dhar"))

    def test_wrapped_ocr_name_agrees_with_separately_labelled_page_name(self):
        text = "Completed by\nJane Doe\nCompleted by Jane\nDoe\nJanuary 1, 2026"
        self.assertEqual(recipients(text, ["Jane Doe"]), ["Jane Doe"])

    def test_partial_name_without_adjacent_corroboration_stays_partial(self):
        self.assertEqual(recipients("Completed by Jane\nJanuary 1, 2026", ["Jane Doe"]), ["Jane"])
        self.assertEqual(recipients("Completed by Jane\nDoe"), ["Jane"])

    def test_distinct_recipients_are_preserved(self):
        text = "Completed by Jane Doe\nCompleted by Jane Smith"
        self.assertEqual(recipients(text, ["Jane Doe"]), ["Jane Doe", "Jane Smith"])

    def test_nonadjacent_names_cannot_complete_a_partial_recipient(self):
        text = "Completed by Jane\nDifferent content\nJane Doe"
        self.assertEqual(recipients(text, ["Jane Doe"]), ["Jane"])

    def test_ocr_columns_do_not_split_a_corroborated_recipient(self):
        blocks = [
            {"text": "Completed by Jane", "imageIndex": 0, "polygon": [[100, 100], [300, 100], [300, 130], [100, 130]]},
            {"text": "Issuer Logo", "imageIndex": 0, "polygon": [[700, 100], [800, 100], [800, 130], [700, 130]]},
            {"text": "Doe", "imageIndex": 0, "polygon": [[100, 132], [200, 132], [200, 160], [100, 160]]},
        ]
        self.assertEqual(recipients(recipient_layout_text(blocks, ["Jane Doe"])), ["Jane Doe"])
        self.assertEqual(recipients(recipient_layout_text(blocks, [])), ["Jane"])
        blocks[2]["imageIndex"] = 1
        self.assertEqual(recipients(recipient_layout_text(blocks, ["Jane Doe"])), ["Jane"])


if __name__ == "__main__":
    unittest.main()
