// Main portal application logic
const API_URL = '/api/tickets';

// Load tickets on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTickets();
    setupFormHandler();
});

// Load and display tickets
async function loadTickets() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.success) {
            displayTickets(data.tickets);
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showAlert('Failed to load tickets', 'error');
    }
}

// Display tickets in the UI
function displayTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No tickets yet. Create your first ticket above!</p>';
        return;
    }
    
    ticketsList.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = 'ticket';
        
        const ticketHeader = document.createElement('div');
        ticketHeader.className = 'ticket-header';
        
        const ticketTitle = document.createElement('div');
        ticketTitle.className = 'ticket-title';
        ticketTitle.textContent = `#${ticket.id} - ${ticket.title}`;
        
        const ticketPriority = document.createElement('span');
        ticketPriority.className = `ticket-priority priority-${ticket.priority}`;
        ticketPriority.textContent = ticket.priority.toUpperCase();
        
        ticketHeader.appendChild(ticketTitle);
        ticketHeader.appendChild(ticketPriority);
        
        const ticketDesc = document.createElement('div');
        ticketDesc.className = 'ticket-description';
        ticketDesc.textContent = ticket.description;
        
        const ticketMeta = document.createElement('div');
        ticketMeta.className = 'ticket-meta';
        
        const ticketStatus = document.createElement('span');
        ticketStatus.className = 'ticket-status';
        ticketStatus.textContent = ticket.status.toUpperCase();
        
        const ticketDate = document.createElement('span');
        ticketDate.textContent = new Date(ticket.createdAt).toLocaleString();
        
        ticketMeta.appendChild(ticketStatus);
        ticketMeta.appendChild(ticketDate);
        
        const ticketActions = document.createElement('div');
        ticketActions.className = 'ticket-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTicket(ticket.id));
        
        ticketActions.appendChild(deleteBtn);
        
        ticketEl.appendChild(ticketHeader);
        ticketEl.appendChild(ticketDesc);
        ticketEl.appendChild(ticketMeta);
        ticketEl.appendChild(ticketActions);
        
        ticketsList.appendChild(ticketEl);
    });
}

// Setup form submission handler
function setupFormHandler() {
    const form = document.getElementById('ticketForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value
        };
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Ticket created successfully!', 'success');
                form.reset();
                loadTickets();
            } else {
                showAlert(data.message || 'Failed to create ticket', 'error');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            showAlert('Failed to create ticket', 'error');
        }
    });
}

// Delete a ticket
async function deleteTicket(id) {
    if (!confirm('Are you sure you want to delete this ticket?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Ticket deleted successfully!', 'success');
            loadTickets();
        } else {
            showAlert(data.message || 'Failed to delete ticket', 'error');
        }
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showAlert('Failed to delete ticket', 'error');
    }
}

// Show alert messages
function showAlert(message, type) {
    // Create alert element if it doesn't exist
    let alert = document.querySelector('.alert');
    if (!alert) {
        alert = document.createElement('div');
        alert.className = 'alert';
        document.querySelector('main').insertBefore(alert, document.querySelector('main').firstChild);
    }
    
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}
