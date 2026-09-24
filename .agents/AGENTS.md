# Regras de Desenvolvimento do Workspace

## Diretório de Deploy (Git Repository)
Toda alteração de código, novos arquivos ou modificações realizadas na pasta do workspace (`C:\Users\Planejador\Downloads\central-gsm-br-main\central-gsm-br-main`) **DEVE** ser copiada ou refletida diretamente para a pasta do repositório Git que está conectada ao GitHub Desktop e ao deploy:
`C:\Users\Planejador\Documents\GitHub\central-gsm-br`

### Ações obrigatórias após edição de arquivos:
Sempre rode um comando de cópia (ou escreva diretamente) para sincronizar o arquivo editado com a respectiva pasta em `C:\Users\Planejador\Documents\GitHub\central-gsm-br`.

## Consultas ao Banco de Dados (Supabase)

**Node.js NÃO está disponível** no PATH do PowerShell neste ambiente. **NUNCA use Node.js** para consultar o banco.

**SEMPRE use `curl.exe`** para consultas à API REST do Supabase. Exemplo:

```powershell
$URL = "https://cvzhczgvfvflmcwmmvlh.supabase.co"
$KEY = "sb_secret_WqYuGx7-UvQEazYdbx0LWA_WTK_iMcP"
curl.exe -s "$URL/rest/v1/profiles?select=id,email,username,cpf&email=eq.usuario@email.com" `
  -H "apikey: $KEY" `
  -H "Authorization: Bearer $KEY" `
  -H "User-Agent: supabase-js/2.0"
```

**NUNCA abra o browser** para consultar o Supabase Dashboard. Use apenas `curl.exe` direto no terminal.

Credenciais do Supabase:
- URL: `https://cvzhczgvfvflmcwmmvlh.supabase.co`
- Service Key: `sb_secret_WqYuGx7-UvQEazYdbx0LWA_WTK_iMcP`
