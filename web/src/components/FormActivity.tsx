import { useState, useCallback } from 'preact/hooks';
import { submitActivity } from '../lib/api';

export function FormActivity() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = useCallback(
    async (e: Event) => {
      e.preventDefault();
      setStatus('sending');

      try {
        const result = await submitActivity({ name, email, message });
        setStatus('success');
        setStatusMessage(result.message || 'Enviado com sucesso!');
        setName('');
        setEmail('');
        setMessage('');
      } catch (err) {
        setStatus('error');
        setStatusMessage(err instanceof Error ? err.message : 'Erro ao enviar');
      }
    },
    [name, email, message]
  );

  return (
    <div class="form-activity">
      <h2>📊 Enviar Atividade</h2>
      <p>Preencha o formulário abaixo. Sua resposta será registrada.</p>

      <form onSubmit={handleSubmit}>
        <div class="form-group">
          <label for="name">Nome *</label>
          <input
            id="name"
            type="text"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            required
            placeholder="Seu nome"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            placeholder="seu@email.com"
          />
        </div>

        <div class="form-group">
          <label for="message">Mensagem *</label>
          <textarea
            id="message"
            value={message}
            onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
            required
            rows={4}
            placeholder="Sua mensagem..."
          />
        </div>

        <button type="submit" class="submit-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {status === 'success' && <div class="alert alert-success">{statusMessage}</div>}
      {status === 'error' && <div class="alert alert-error">{statusMessage}</div>}
    </div>
  );
}
