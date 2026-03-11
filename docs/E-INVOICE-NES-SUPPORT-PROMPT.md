# E-Invoice NES API – Support / Forum Prompt (English)

Use this when asking a foreign support team, integrator’s global support, or another AI about the NES e-invoice errors.

---

## Option 1: For a developer forum or AI (detailed)

I am sending e-invoices in **UBL-TR XML** format via the **NES API**.

1. **404 Not Found**  
   The primary send endpoint returns 404. Our automatic retry then builds UBL-TR from invoice data and posts that XML; that request gets **422 Unprocessable Entity** instead of 404.

2. **422 Schematron – tax type and percentage**  
   The 422 response contains:
   ```json
   {
     "message": "HATALI ISTEK",
     "errors": [{
       "code": "1150",
       "description": "SCHEMATRON_CHECK_RESULT_HAS_FAILED",
       "detail": "Incompatible tax type percentage: The percentage of tax type '602' cannot be '9'."
     }]
   }
   ```
   We use **WithholdingTaxTotal** (tevkifat) with:
   - `cac:TaxSubtotal` containing `cbc:TaxableAmount`, `cbc:TaxAmount`, `cbc:Percent`, and `cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode`.
   - TaxTypeCode **602** (9/10 KDV tevkifatı).
   - We had tried **Percent = 9** (numerator); the validator rejected it. We switched to **Percent = 90** (actual percentage).  
   **Question:** For Turkish e-invoice (UBL-TR), in `WithholdingTaxTotal/cac:TaxSubtotal`, should `cbc:Percent` be the **actual percentage** (e.g. 90 for 9/10) or the **numerator** (e.g. 9)? Is there an official GIB/NES code list that defines allowed (TaxTypeCode, Percent) pairs?

3. **SenderAlias**  
   The same flow shows a message that **SenderAlias** must be set in the configuration. We do send issuer (sender) data in the UBL.  
   **Question:** Is SenderAlias a separate NES/portal setting (e.g. alias for the API user), or must it also appear in the XML? If in XML, which element or attribute?

4. **404 on primary endpoint**  
   We use the base URL we were given (e.g. `https://apitest.nes.com.tr`).  
   **Question:** For **sending** an e-invoice (not sync/list), what is the correct path and method (e.g. POST to `/v1/outgoing/invoices` or another path)? Is there a different base URL or version (v1 vs v2) we should use for the send operation?

Please explain the root causes and suggest exact fixes for:  
- the tax type / percentage (602 and Percent),  
- SenderAlias,  
- and the 404 send endpoint.

---

## Option 2: Short version (e.g. for ticket or chat)

We get **404** on the main e-invoice send endpoint, then **422** when retrying with UBL-TR XML. The 422 says: *"The percentage of tax type '602' cannot be '9'"*. We use WithholdingTaxTotal with TaxTypeCode 602 and Percent 9 (9/10 tevkifat). We also see that SenderAlias must be filled.  

Can you confirm:  
1) For WithholdingTaxTotal, should Percent be the actual percentage (90) or the numerator (9) for code 602?  
2) Where exactly must SenderAlias be set (portal vs XML)?  
3) The correct URL path and method for sending an e-invoice (POST path and base URL)?

---

## What we changed in our code (for reference)

- **Percent:** We now send the **actual percentage** (20, 50, 70, 90) for tevkifat codes 601–623, e.g. 602 → 90. So the “602 cannot be 9” error should be addressed by sending 90 instead of 9.
- **SenderAlias** and **404** still need to be confirmed with NES/GIB or the integrator.
