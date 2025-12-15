# Wash&Clean Website (Versão do Zero)

Esta pasta contém uma nova versão do site para a Wash&Clean, criada completamente de raiz com inspiração em sites modernos como o BROT Auto Detailing. O objectivo é prender o cliente com um design apelativo, informação organizada e ferramentas de marcação online.

## Estrutura

```
washandclean_site_v2/
├── index.html        # Página principal com todas as secções
├── styles.css        # Folha de estilos com design moderno e responsivo
├── script.js         # Lógica de slider, marcação e integração EmailJS
├── assets/
│   ├── before.jpg    # Placeholder para imagem “Antes” (substituir por real)
│   ├── after.jpg     # Placeholder para imagem “Depois” (substituir por real)
│   └── logo.png      # Logótipo (podes substituir pelo teu)
└── README.md         # Este ficheiro
```

## Principais secções

### Barra de navegação
- Contém links para “Serviços”, “Antes & Depois”, “Testemunhos”, “Áreas” e “Marcação”.
- Fixa-se ao topo (sticky) para fácil navegação.

### Hero
- Slogan atrativo (“Luxo e Cuidado onde quer que esteja”).
- Botões de ação: “Marcar agora” e “Ver Antes & Depois”.
- Fundo em gradiente azul para dar destaque.

### Serviços
- Quatro cartas com detalhes dos principais serviços: Lavagem Exterior, Lavagem Interior, Detalhamento Completo e Extras.
- Cada carta inclui uma lista de tarefas de forma clara.

### Antes & Depois
- Slider interactivo: permite arrastar um separador para comparar duas imagens (`before.jpg` e `after.jpg`).
- Usa placeholders; substitui estes ficheiros por fotos reais dos teus trabalhos.

### Testemunhos
- Três testemunhos fictícios para ilustrar feedback positivo.
- Podes adicionar mais ou substituir pelos testemunhos dos teus clientes.

### Áreas de Serviço
- Indica as regiões onde a Wash&Clean opera (Guimarães, Braga e Porto). Ajusta conforme necessário.

### Marcação
- Formulário de marcação completo com nome, email, serviço, localidade, data, hora e mensagem.
- Validação de horários conforme as regras:
  - **Segunda a Sexta:** 17:30 – 21:30
  - **Sábado e Domingo:** 10:00 – 19:00
- Verifica disponibilidade e grava as marcações no `localStorage`.
- Sugere automaticamente o próximo horário livre se o escolhido estiver ocupado.
- Integração com EmailJS preparada através de placeholders. Para ativar:
  1. Cria uma conta em [EmailJS](https://www.emailjs.com).
  2. Obtém o `PUBLIC_KEY`, `SERVICE_ID` e `TEMPLATE_ID`.
  3. Insere esses valores nas variáveis no topo de `script.js`.
  4. Cria um modelo de email com as variáveis (`nome`, `email`, `servico`, etc.).

### Footer
- Contactos da empresa.
- Links rápidos para as secções do site.
- Redes sociais (placeholders).
- Copyright.

## Publicação no GitHub Pages
1. Cria um repositório chamado `washandclean.github.io` na tua conta ou organização.
2. Faz upload de todo o conteúdo da pasta `washandclean_site_v2` para a branch `main` (inclui as pastas e ficheiros).
3. Em **Settings → Pages**, define Source para **main** e pasta **/(root)**.
4. Guarda as alterações. Após alguns minutos o site estará disponível em `https://washandclean.github.io/`.

## Personalizações sugeridas
- **Imagens reais:** substitui `before.jpg` e `after.jpg` na pasta `assets` por fotografias reais de veículos antes e depois do teu serviço.
- **Testemunhos autênticos:** edita os testemunhos no HTML para refletir feedback real dos clientes.
- **Cores e logótipo:** adapta as cores e o logótipo no CSS conforme a identidade visual da Wash&Clean.
- **Localidades:** actualiza a secção de áreas de serviço se operares noutras zonas.

Com estas instruções, terás um site moderno e optimizado para atrair clientes e facilitar as marcações online.
