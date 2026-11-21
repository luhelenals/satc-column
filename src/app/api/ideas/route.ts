import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY não encontrada no .env.local.' },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json().catch(() => ({}));
    const customVibe = body.vibe
      ? `Foco extra pedido pela autora: "${body.vibe}".`
      : '';

    const today = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const prompt = `
Hoje é ${today}.
Você é uma editora criativa ajudando uma colunista (estilo Carrie Bradshaw de Sex and the City, mas moderna, com estética anos 2000, que escreve sobre assuntos femininos/girly, relacionamentos, música pop, livros, política, vivências LGBT e tecnologia).
${customVibe}

Gere 4 sugestões de pautas/prompts originais para ela escrever sua coluna semanal, conectando cultura pop, música, livros, comportamento digital, política ou relacionamentos modernos com uma reflexão pessoal, afiada e envolvente.
Responda em Português do Brasil.

IMPORTANTE: Retorne APENAS um array JSON válido (sem markdown, sem \`\`\`json, sem texto antes ou depois), seguindo exatamente esta estrutura:
[
  {
    "title": "Título magnético estilo coluna de revista/blog",
    "summary": "Resumo curto de 1 a 2 frases do tema da coluna",
    "promptQuestion": "A pergunta central estilo 'Eu não pude deixar de me perguntar...' e tópicos para guiar a escrita",
    "culturalHook": "Tema cultural, álbum pop, livro ou tendência que inspirou essa ideia",
    "tags": ["pop", "livros", "tech"]
  }
]
`;

    // 1. Lista automaticamente os modelos disponíveis na sua chave
    const availableModels: string[] = [];
    const pager = await ai.models.list();
    for await (const m of pager) {
      if (
        m.name &&
        m.supportedActions?.includes('generateContent') &&
        m.name.includes('gemini') &&
        !m.name.includes('embedding') &&
        !m.name.includes('imagen') &&
        !m.name.includes('veo')
      ) {
        availableModels.push(m.name.replace('models/', ''));
      }
    }

    // Prioriza modelos lite / flash (mais rápidos e com maior cota gratuita)
    const prioritized = [
      ...availableModels.filter((n) => n.includes('lite')),
      ...availableModels.filter((n) => n.includes('flash') && !n.includes('lite')),
      ...availableModels.filter((n) => !n.includes('flash')),
    ];

    if (prioritized.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum modelo Gemini com suporte a generateContent foi encontrado nessa chave.' },
        { status: 500 }
      );
    }

    // 2. Testa os modelos habilitados na sua conta até um responder com sucesso
    let rawText = '';
    let lastError: unknown = null;

    for (const modelName of prioritized) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        rawText = response.text || '[]';
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) {
      throw new Error(
        `Modelos testados (${prioritized.join(', ')}), mas falharam: ${
          lastError instanceof Error ? lastError.message : String(lastError)
        }`
      );
    }

    const cleanedJson = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const ideas = JSON.parse(cleanedJson);
    return NextResponse.json({ ideas });
  } catch (err: unknown) {
    console.error('Erro detalhado Gemini API:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Falha ao gerar ideias com o Gemini.',
      },
      { status: 500 }
    );
  }
}