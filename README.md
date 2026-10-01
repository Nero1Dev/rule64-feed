# rule34-feed

App mobile (Expo / React Native) estilo TikTok para rolar as mídias do rule34.xxx.

- Feed vertical em tela cheia (vídeos com autoplay, GIFs e imagens)
- Abas de feeds por tema (tags), com autocomplete — segure uma aba para editar/excluir
- Toque em `#` num post → toque numa tag para abrir um feed dela, segure para bloqueá-la
- Salvos (♥), blacklist, filtro de tipo de mídia, ordenação por votos
- Tags de conteúdo envolvendo menores são sempre bloqueadas

## Rodar (web / PWA)

```bash
npm install
npx expo start --web --port 8081
```

Abra no navegador do celular e use "Adicionar à tela inicial".

## Deploy no Vercel

Já configurado (`vercel.json` + `api/paheal.ts`, que é o proxy do Paheal em produção).

- Pelo site: vercel.com → *Add New → Project* → importe este repositório → *Deploy* (não precisa mudar nenhuma opção).
- Ou pela CLI: `npm i -g vercel` e `vercel --prod`.

Depois abra o link `https://<projeto>.vercel.app` no celular e use "Adicionar à tela inicial".

## Rodar (Expo Go)

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** no celular.

## Fontes (⚙ → Fonte)

| Fonte | Login | Observação |
|---|---|---|
| **Paheal** (padrão) | não | Na web passa pelo proxy `/proxy/paheal` do servidor (`metro.config.js`) |
| **e621** | não | Chamada direta do celular |
| **rule34.xxx** | `api_key` + `user_id` | *My Account → Options → API Access Credentials* |

## Gerar APK

```bash
npx eas-cli@latest build -p android --profile preview
```
