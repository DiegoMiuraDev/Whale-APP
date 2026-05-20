# Whale — Roteiro de demo (60s)

## Setup antes da gravação

1. `.env.local` com Spotify, AudD (ou mock) e OpenAI configurados.
2. Conta Spotify de teste logada.
3. Abrir `/agent` e ter uma música tocando no celular (para identificar).

## Roteiro

| Tempo | Ação | Fala sugerida |
|-------|------|---------------|
| 0–10s | Landing `/` | "Quem usa Spotify perde músicas no bar, na festa, na academia. Whale é a camada inteligente em cima." |
| 10–20s | Login Spotify | "Um clique — não substituímos o Spotify, conectamos." |
| 20–35s | `/agent` → microfone | Tocar música ambiente → Identificar → "Em 5 segundos sabemos a faixa e abrimos no Spotify." |
| 35–45s | Busca por letra | Colar trecho → mostrar match. |
| 45–55s | Chat agente | "Playlist temporária de 2 horas com rock dos 90s" → playlist criada. |
| 55–60s | `/playlists` | Mostrar badge "24h restantes" + modelo freemium/B2B. |

## Métricas para investidor (MVP)

- Identificações / dia
- Playlists criadas (temp vs permanentes)
- Retenção D7

## Modelo de receita

1. Freemium — 20 identificações/mês
2. Pro — agente + temporárias ilimitadas
3. B2B — festas, academias, varejo (white-label)
