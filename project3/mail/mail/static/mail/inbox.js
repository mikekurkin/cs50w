document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = post_email;

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

  // Clear out error alert
  const formAlert = document.querySelector('#form_alert');
  if (formAlert != null) {
    formAlert.remove();
  }
}

function post_email() {
  const recipients = document.querySelector('#compose-recipients').value
  const subject = document.querySelector('#compose-subject').value
  const body = document.querySelector('#compose-body').value
  
  fetch('/emails', {
    method: 'POST', 
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    if (result.error != undefined) {
      const alertEl = document.createElement('div')
      alertEl.id = 'form_alert'
      alertEl.classList.add('alert')
      alertEl.classList.add('alert-danger')
      alertEl.innerHTML = result.error
      const formAlert = document.querySelector('#form_alert');
      if (formAlert != null) {
        formAlert.remove();
      }
      document.querySelector('#compose-form').prepend(alertEl);
    } else {
      load_mailbox('sent');
    } 
  })
  
  return false;
}

// Returns email list card element
function list_card_el(email) {
  const e = document.createElement('button');
  e.id = `email${email.id}`;
  e.type = 'button';
  e.classList.add('list-group-item');
  e.classList.add('list-group-item-action');
  e.innerHTML = `
    <h5 class="mb-1">${email.sender}</h5>
    <p class="mb-1">${email.subject}</p>
    <small>${email.timestamp}</small>
  `;
  if (email.read === false) {e.classList.add('unread-item')}
  e.addEventListener('click', () => load_email(email.id));
  return e;
}

// Returns email body view element
function email_view_el(email) {
  emailView = document.createElement('div');
  emailView.id = 'email_view';
  emailView.classList.add('col-8');

  emailView.innerHTML = `
    <h5 id="from">${email.sender}</h5>
    <h4 id="subject">${email.subject}</h4>
    <p id="to" class="mb-1">To: ${email.recipients}</p>
    <small id="time" class="text-muted font-italic">${email.timestamp}</small>
    <hr />
    <p id="body">${email.body}</p>
  `

  return emailView
} 

function mailbox_wrapper_el() {
  const mailboxWrapper = document.createElement('div')
  mailboxWrapper.id = 'mailbox-wrapper';
  mailboxWrapper.classList.add('row');
  const mailbox = document.createElement('div');
  mailbox.id = 'mailbox';
  mailbox.classList.add('col');
  mailbox.classList.add('list-group');
  
  mailboxWrapper.appendChild(mailbox);

  return mailboxWrapper;
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
      
      document.querySelector('#emails-view').appendChild(mailbox_wrapper_el());
    
      emails.forEach(email => {
        document.querySelector('#mailbox').appendChild(list_card_el(email));
      });
    };
  })
  .catch(error => console.log(error));
}

function load_email(id) {
  console.log(`loading ${id}`);
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .then(() => {
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector(`#email${email.id}`).replaceWith(list_card_el(email));
  
      // Remove all active attributes and set for the current card
      document.querySelectorAll(`button.active`).forEach(el => {
        el.classList.remove('active');
      })
      document.querySelector(`#email${email.id}`).classList.add('active')

      let emailView = document.querySelector('#email_view');
      if (emailView != null) {
        emailView.remove();
      }
      document.querySelector('#mailbox-wrapper').appendChild(email_view_el(email));
    
    });
  })
  .catch(error => console.log(error));
}