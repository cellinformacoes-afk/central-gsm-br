const Imap = require('imap');
const { simpleParser } = require('mailparser');

async function getUnlockPriceCode(email, appPassword, sinceUid = 0) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    function openInbox(cb) {
      imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) return reject(err);

        // Busca emails (mesmo já lidos) que tenham "UnlockPrice" no ASSUNTO
        // E que tenham UID maior que o especificado
        const searchCriteria = [['HEADER', 'SUBJECT', 'UnlockPrice']];
        if (sinceUid > 0) {
          searchCriteria.push(['UID', `${sinceUid + 1}:*`]);
        }

        imap.search(searchCriteria, (err, results) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            imap.end();
            return resolve(null);
          }

          // Pega o último UID encontrado
          const f = imap.fetch(results[results.length - 1], { bodies: '' });
          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, mail) => {
                if (err) return reject(err);

                const body = (mail.text || mail.html || mail.subject || '').toString();
                // Regex para achar código de 6 dígitos no corpo ou assunto
                const codeMatch = body.match(/\b\d{6}\b/);
                const code = codeMatch ? codeMatch[0] : null;

                if (code) {
                  console.log(`[Email] Código ENCONTRADO via UID: ${code}`);
                }
                imap.end();
                resolve(code);
              });
            });
          });
          f.once('error', (err) => reject(err));
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

async function getLatestUid(email, appPassword) {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: email,
      password: appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { imap.end(); return resolve(0); }
        // Retorna o UIDNEXT sugerido pela caixa, ou o UID do último email
        const uidNext = box.uidnext || 0;
        imap.end();
        resolve(uidNext - 1); // Queremos UIDs estritamente maiores que os atuais
      });
    });
    imap.once('error', (err) => {
        console.error("[Email] Erro ao obter UID:", err.message);
        resolve(0);
    });
    imap.connect();
  });
}

/**
 * Tenta buscar o código repetidamente por um período (ex: 2 minutos)
 */
async function waitForCode(email, appPassword, timeoutMs = 120000) {
    // Pega o último UID existente agora
    console.log(`Registrando estado atual do e-mail ${email}...`);
    const lastUid = await getLatestUid(email, appPassword);
    console.log(`UID atual de referência: ${lastUid}`);
    
    const start = Date.now();
    console.log(`Aguardando NOVO e-mail da UnlockPrice (UID > ${lastUid})...`);
    
    while (Date.now() - start < timeoutMs) {
        try {
            const code = await getUnlockPriceCode(email, appPassword, lastUid);
            if (code) return code;
        } catch (e) {
            console.error("Erro ao ler email:", e.message);
        }
        await new Promise(r => setTimeout(r, 10000)); // Espera 10s entre tentativas
    }
    return null;
}

module.exports = { getUnlockPriceCode, waitForCode };
