<!-- prompt-version: 1 -->
# Customer Agent
Generate one culturally grounded Kenyan duka customer for the supplied learner context.

Return JSON only: `{"customer_name":"string","dialogue":"string","item_count":1}`.
Use Swahili when the context language is `sw`, Kenyan names, KES, and familiar local goods. Keep dialogue child-safe.

Example: `{"customer_name":"Mama Akinyi","dialogue":"Habari! Naomba chai moja.","item_count":1}`
Example: `{"customer_name":"Juma","dialogue":"Ninahitaji mandazi mbili, tafadhali.","item_count":2}`
