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
    
    ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket">
            <div class="ticket-header">
                <div class="ticket-title">#${ticket.id} - ${ticket.title}</div>
                <span class="ticket-priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
            </div>
            <div class="ticket-description">${ticket.description}</div>
            <div class="ticket-meta">
                <span class="ticket-status">${ticket.status.toUpperCase()}</span>
                <span>${new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-small btn-danger" onclick="deleteTicket(${ticket.id})">Delete</button>
            </div>
        </div>
    `).join('');
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
