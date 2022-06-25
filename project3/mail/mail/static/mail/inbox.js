document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').id = 'archive'; // For navigation based on mailbox name
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  document.querySelector('#compose-form').onsubmit = post_email;

  // By default, load the inbox
  let current_mailbox = 'inbox';
  load_mailbox(current_mailbox);
});

function compose_email(reply_email = null) {
  document.querySelectorAll('.container button.active').forEach(el => {
    el.classList.remove('active');
  });
  if (document.querySelector('#compose') != null) {
    document.querySelector('#compose').classList.add('active');
  }

  // Show compose view and hide other views
  document.querySelector('#emails-view').setAttribute('hidden', true);
  document.querySelector('#compose-view').removeAttribute('hidden');

  if (reply_email === null) {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    // Pre-fill fields from reply email
    document.querySelector('#compose-recipients').value = reply_email.sender;
    if (reply_email.subject.slice(0, 3).toLowerCase() != 're:') {
      document.querySelector('#compose-subject').value = `Re: ${reply_email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = `${reply_email.subject}`;
    }
    document.querySelector('#compose-body').value = `
---
On ${reply_email.timestamp} ${reply_email.sender} wrote:

${reply_email.body}`;

    document.querySelector('#compose-body').focus();
  }

  // Clear out error alert
  const formAlert = document.querySelector('#form_alert');
  if (formAlert != null) {
    formAlert.remove();
  }
}

function post_email() {
  // Get values from fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  // Send request
  fetch('/emails', {
    method: 'POST', 
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
  .then(response => response.json())
  .then(result => {
    if (result.error != undefined) {
      // Present error if API request has one
        const alertEl = document.createElement('div');
        alertEl.id = 'form_alert';
        alertEl.classList.add('alert');
        alertEl.classList.add('alert-danger');
        alertEl.innerHTML = result.error;
      const formAlert = document.querySelector('#form_alert');
      if (formAlert != null) {
        formAlert.remove();
      }
      document.querySelector('#compose-form').prepend(alertEl);
    } else {
      // If no error show sent inbox
      load_mailbox('sent');
    } 
    });
  
  return false;
}

function load_mailbox(mailbox) {
  // Remove all active button attributes and set for the current mailbox
  document.querySelectorAll('.container button.active').forEach(el => {
    el.classList.remove('active');
  });
  if (document.querySelector(`#${mailbox}`) != null) {
    document.querySelector(`#${mailbox}`).classList.add('active');
  }
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').removeAttribute('hidden');
  document.querySelector('#compose-view').setAttribute('hidden', true);

  // Show the mailbox name with listener to re-load mailbox
  const mailboxTitle = document.createElement('div')
  mailboxTitle.id = 'mailbox-title'
  mailboxTitle.innerHTML = `<a class="text-dark text-decoration-none" href="#"><h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3></a>`;
  mailboxTitle.addEventListener('click', () => {load_mailbox(mailbox)})
  if (document.querySelector('#mailbox-title') === null) {
    document.querySelector('#emails-view').appendChild(mailboxTitle);
  } else {
    document.querySelector('#mailbox-title').replaceWith(mailboxTitle);
  }

  current_mailbox = mailbox;

  // Get the list of e-mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (document.querySelector('#mailbox-wrapper') === null) {
        document.querySelector('#emails-view').appendChild(mailbox_wrapper_el());
    } else {
        document.querySelector('#mailbox-wrapper').replaceWith(mailbox_wrapper_el());
    }

    // Show list of e-mails
    if (emails.length > 0) {
      emails.forEach(email => {
        document.querySelector('#mailbox').appendChild(list_card_el(email));
      });
      }
  })
  .catch(error => console.log(error));
}

// Set read property to true
function load_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
  })
  .then(() => {
    // Load the email
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector(`#email${email.id}`).replaceWith(list_card_el(email));
  
      // Remove all active card attributes and set for the current card
      document.querySelectorAll('#mailbox button.active').forEach(el => {
        el.classList.remove('active');
          });
      document.querySelector(`#email${email.id}`).classList.add('active');

      // Hide mailbox column on small screens
      document.querySelector(`#mailbox`).classList.add('d-none');

      // Show email view
      const emailView = document.querySelector('#email_view');
      if (emailView != null) {
        emailView.replaceWith(email_view_el(email));
      } else {
        document.querySelector('#mailbox-wrapper').appendChild(email_view_el(email));
      }
    });
  })
  .catch(error => console.log(error));
}

function set_archived(email_id, value = true) {
  // Send request to set archived property true or false
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: value,
    }),
  })
  .then(() => {
    load_mailbox('inbox');
    if (!value) {
      load_email(email_id);
    }
  })
  .catch(error => console.log(error));
}

// Returns email list card element
function list_card_el(email) {
  const e = document.createElement('button');
  e.id = `email${email.id}`;
  e.type = 'button';
  e.classList.add('list-group-item');
  e.classList.add('list-group-item-action');
  e.innerHTML = `
    <div class="row">
    <div id="mark" class="px-2 text-align-center">
    </div>
    <div>
    <h5 class="mb-1">${email.sender}</h5>
    <p class="mb-1">${email.subject}</p>
    <small class="font-italic">${email.timestamp}</small>
    </div>
    </div>
  `;
  if (email.read === false) {
    e.classList.add('unread-item');
    e.querySelector('#mark').innerHTML = '<small class="bi bi-circle-fill text-primary"></i>';
  }
  e.addEventListener('click', () => load_email(email.id));
  return e;
}

// Returns email body view element
function email_view_el(email) {
  emailView = document.createElement('div');
  emailView.id = 'email_view';
  emailView.classList.add('col-md-8');
  emailView.classList.add('border');
  emailView.classList.add('rounded');

  emailView.innerHTML = `
    <div class="row mt-3">
    <div class="col">
    <h5 id="from">${email.sender}</h5>
    <h4 id="subject">${email.subject}</h4>
    <p id="to" class="mb-1">To: ${email.recipients}</p>
    <small id="time" class="text-muted font-italic">${email.timestamp}</small>
    </div>
    <div class="col-auto">
    <a id="archive" href="#" title="Archive" class="h3 mx-1 bi-archive"></a>
    <a id="unarchive" href="#" title="Unarchive" class="h3 mx-1 bi-archive-fill"></a>
    <a id="reply" href="#" title="Reply" class="h3 mx-1 bi-reply-all"></a>
    </div>
    </div>
    <hr class="mx-n3" />
    <p id="email-body">${email.body}</p>
  `;
  emailView.querySelector('#archive').addEventListener('click', () => {
    set_archived(email.id, true);
  });
  emailView.querySelector('#unarchive').addEventListener('click', () => {
    set_archived(email.id, false);
  });
  emailView.querySelector('#reply').addEventListener('click', () => {
    compose_email(email);
  });

  if (email.archived || current_mailbox === 'sent') {
    emailView.querySelector('#archive').remove();
  }
  if (!email.archived || current_mailbox === 'sent') {
    emailView.querySelector('#unarchive').remove();
  }

  return emailView;
} 

// Returns mailbox wrapper structure element
function mailbox_wrapper_el() {
  const mailboxWrapper = document.createElement('div');
  mailboxWrapper.id = 'mailbox-wrapper';
  mailboxWrapper.classList.add('row');
  const mailbox = document.createElement('div');
  mailbox.id = 'mailbox';
  mailbox.classList.add('col-md');
  mailbox.classList.add('d-md-block');
  mailbox.classList.add('px-md-3');
  mailbox.classList.add('px-0');
  mailbox.classList.add('list-group');
  
  mailboxWrapper.appendChild(mailbox);

  return mailboxWrapper;
}
