# Reconstrucție Virtual Staging

## Obiectiv
Refac fluxul complet astfel încât generarea să nu mai depindă de vechea funcție AI comună și să ofere erori reale, progres stabil și salvare sigură.

## Implementare
1. Separ logica Virtual Staging într-un modul server-only dedicat, cu validare strictă pentru imagine, cameră, stil și instrucțiuni.
2. Refac endpointul `/api/virtual-staging` ca rută de editare imagine dedicată, folosind endpointul oficial de image edits al Lovable AI Gateway și modelul implicit `openai/gpt-image-2`.
3. Păstrez cheia exclusiv server-side, verific configurația la fiecare cerere și propag exact statusul și mesajul Gateway; retry limitat doar pentru `429` și `5xx`.
4. Protejez generarea cu parola sesiunii admin existente, fără schimbarea autentificării și fără politici anon noi.
5. Simplific pagina admin: procesare secvențială stabilă, progres per imagine, anulare/reset sigur, erori clare, reîncercare individuală, comparare înainte/după, descărcare și salvare.
6. Păstrez listarea publică a imaginilor și upload/delete prin ruta server-side existentă cu service role.

## Validare
- Test endpoint cu imagine reală și sesiune admin validă.
- Confirm rezultat imagine valid, salvare persistentă, listare și ștergere efectivă.
- Verific stările de eroare: parolă lipsă/greșită, payload invalid și răspuns Gateway.
- Verific buildul și fluxul în browser pe pagina admin.

## Fișiere vizate
- `src/routes/api/virtual-staging.ts`
- modul server-only nou pentru generare
- `src/pages/admin/VirtualStagingPage.tsx`
- eventual helper client dedicat, fără schimbări în autentificarea admin sau politicile publice
