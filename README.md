# rule34-feed

App mobile (Expo / React Native) estilo TikTok para rolar as mídias do rule34.xxx.

- Feed vertical em tela cheia (vídeos com autoplay, GIFs e imagens)
- Abas de feeds por tema (tags), com autocomplete — segure uma aba para editar/excluir
- Toque em `#` num post → toque numa tag para abrir um feed dela, segure para bloqueá-la
- Salvos (♥), blacklist, filtro de tipo de mídia, ordenação por votos
- Tags de conteúdo envolvendo menores são sempre bloqueadas

## Rodar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** no celular.

## API

A API do rule34 exige credenciais: crie uma conta, vá em *My Account → Options → API Access Credentials*
e cole `user_id` e `api_key` em ⚙ Configurações no app.

## Gerar APK

```bash
npx eas-cli@latest build -p android --profile preview
```
