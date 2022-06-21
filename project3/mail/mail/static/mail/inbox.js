document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  // document.querySelector('#emails-view').style.display = 'none';
  // document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').setAttribute('hidden', true);
  document.querySelector('#compose-view').removeAttribute('hidden');

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  // document.querySelector('#emails-view').style.display = 'block';
  // document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').removeAttribute('hidden');
  document.querySelector('#compose-view').setAttribute('hidden', true);

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the list of e-mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails.length);

    // Show list of e-mails
    if (emails.length > 0) {
      const emailsView = document.querySelector('#emails-view');
      const mailboxWrapper = document.createElement('div')
      mailboxWrapper.id = 'mailbox-wrapper';
      mailboxWrapper.classList.add('row');
      const mailbox = document.createElement('div');
      mailbox.id = 'mailbox';
      mailbox.classList.add('col');
      emailsView.appendChild(mailboxWrapper);
      mailboxWrapper.appendChild(mailbox);
    
      emails.forEach(email => {
        const e = document.createElement('div');
        e.innerHTML = `<a href='#'><b>${email.sender}: ${email.subject}</b></a>`;
        e.addEventListener('click', () => load_email(email.id));
        document.querySelector('#mailbox').appendChild(e);
      });
    };
  })
  .catch(error => console.log(error));
};

function load_email(id) {
  console.log(`loading ${id}`);
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    let emailView = document.querySelector('#email_view');
    if (emailView != null) {
      emailView.remove();
    }
    emailView = document.createElement('div');
    emailView.id = 'email_view';
    emailView.classList.add('col-8');
    emailView.classList.add('border-left');
    document.querySelector('#mailbox-wrapper').appendChild(emailView);
  
    const subject = document.createElement('h5');
    const from = document.createElement('p');
    const to = document.createElement('p');
    const time = document.createElement('p');
    const body = document.createElement('p');
    
    subject.id = 'subject';
    from.id = 'from';
    to.id = 'to';
    time.id = 'time';
    body.id = 'body';

    subject.innerHTML = email.subject;
    from.innerHTML = `From: ${email.sender}`;
    to.innerHTML = `To: ${email.recipients}`;
    time.innerHTML = email.timestamp;
    body.innerHTML = email.body;

    emailView.appendChild(subject);
    emailView.appendChild(from);
    emailView.appendChild(to);
    emailView.appendChild(time);
    emailView.appendChild(body);
    
  })
  .catch(error => console.log(error));
};