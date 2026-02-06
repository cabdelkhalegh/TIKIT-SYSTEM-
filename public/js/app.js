// TiKiT Agency Management System - Main Application Logic
const CAMPAIGNS_API = '/api/campaigns';
const INFLUENCERS_API = '/api/influencers';

let currentTab = 'campaigns';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadCampaigns();
    loadInfluencers();
    setupCampaignForm();
    setupInfluencerForm();
});

// Tab Management
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Campaign Management
async function loadCampaigns() {
    try {
        const response = await fetch(CAMPAIGNS_API);
        const data = await response.json();
        
        if (data.success) {
            displayCampaigns(data.campaigns);
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showAlert('Failed to load campaigns', 'error');
    }
}

function displayCampaigns(campaigns) {
    const campaignsList = document.getElementById('campaignsList');
    
    if (campaigns.length === 0) {
        campaignsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No campaigns yet. Create your first campaign above!</p>';
        return;
    }
    
    campaignsList.innerHTML = '';
    
    campaigns.forEach(campaign => {
        const campaignEl = document.createElement('div');
        campaignEl.className = 'campaign-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = `#${campaign.id} - ${campaign.campaignName}`;
        
        const priority = document.createElement('span');
        priority.className = `badge priority-${campaign.priority}`;
        priority.textContent = campaign.priority.toUpperCase();
        
        header.appendChild(title);
        header.appendChild(priority);
        
        const body = document.createElement('div');
        body.className = 'card-body';
        
        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = campaign.description;
        
        const details = document.createElement('div');
        details.className = 'details-grid';
        
        if (campaign.influencerName) {
            const infDetail = document.createElement('div');
            const label = document.createElement('strong');
            label.textContent = 'Influencer:';
            infDetail.appendChild(label);

            infDetail.appendChild(document.createTextNode(' ' + campaign.influencerName));

            if (campaign.influencerPlatform) {
                infDetail.appendChild(document.createTextNode(' (' + campaign.influencerPlatform + ')'));
            }
            details.appendChild(infDetail);
        }
        
        if (campaign.budget > 0) {
            const budgetDetail = document.createElement('div');
            budgetDetail.innerHTML = `<strong>Budget:</strong> $${campaign.budget.toLocaleString()}`;
            details.appendChild(budgetDetail);
        }
        
        if (campaign.deliveryDate) {
            const dateDetail = document.createElement('div');
            const date = new Date(campaign.deliveryDate);
            dateDetail.innerHTML = `<strong>Delivery:</strong> ${date.toLocaleDateString()}`;
            details.appendChild(dateDetail);
        }
        
        if (campaign.deliverables) {
            const deliverablesDetail = document.createElement('div');
            deliverablesDetail.innerHTML = `<strong>Deliverables:</strong> ${campaign.deliverables}`;
            details.appendChild(deliverablesDetail);
        }
        
        body.appendChild(description);
        body.appendChild(details);
        
        const footer = document.createElement('div');
        footer.className = 'card-footer';
        
        const status = document.createElement('span');
        status.className = `badge status-${campaign.status}`;
        status.textContent = campaign.status.toUpperCase();
        
        const paymentStatus = document.createElement('span');
        paymentStatus.className = `badge payment-${campaign.paymentStatus}`;
        paymentStatus.textContent = `Payment: ${campaign.paymentStatus.toUpperCase()}`;
        
        const createdDate = document.createElement('span');
        createdDate.style.fontSize = '0.85em';
        createdDate.style.color = '#666';
        createdDate.textContent = new Date(campaign.createdAt).toLocaleDateString();
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteCampaign(campaign.id));
        
        actions.appendChild(deleteBtn);
        
        footer.appendChild(status);
        footer.appendChild(paymentStatus);
        footer.appendChild(createdDate);
        footer.appendChild(actions);
        
        campaignEl.appendChild(header);
        campaignEl.appendChild(body);
        campaignEl.appendChild(footer);
        
        campaignsList.appendChild(campaignEl);
    });
}

function setupCampaignForm() {
    const form = document.getElementById('campaignForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            campaignName: document.getElementById('campaignName').value,
            description: document.getElementById('description').value,
            influencerName: document.getElementById('influencerName').value,
            influencerPlatform: document.getElementById('influencerPlatform').value,
            budget: parseFloat(document.getElementById('budget').value) || 0,
            deliveryDate: document.getElementById('deliveryDate').value,
            deliverables: document.getElementById('deliverables').value,
            priority: document.getElementById('priority').value
        };
        
        try {
            const response = await fetch(CAMPAIGNS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Campaign created successfully!', 'success');
                form.reset();
                loadCampaigns();
            } else {
                showAlert(data.message || 'Failed to create campaign', 'error');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            showAlert('Failed to create campaign', 'error');
        }
    });
}

async function deleteCampaign(id) {
    if (!confirm('Are you sure you want to delete this campaign?')) {
        return;
    }
    
    try {
        const response = await fetch(`${CAMPAIGNS_API}/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Campaign deleted successfully!', 'success');
            loadCampaigns();
        } else {
            showAlert(data.message || 'Failed to delete campaign', 'error');
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        showAlert('Failed to delete campaign', 'error');
    }
}

// Influencer Management
async function loadInfluencers() {
    try {
        const response = await fetch(INFLUENCERS_API);
        const data = await response.json();
        
        if (data.success) {
            displayInfluencers(data.influencers);
        }
    } catch (error) {
        console.error('Error loading influencers:', error);
        showAlert('Failed to load influencers', 'error');
    }
}

function displayInfluencers(influencers) {
    const influencersList = document.getElementById('influencersList');
    
    if (influencers.length === 0) {
        influencersList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No influencers yet. Add your first influencer above!</p>';
        return;
    }
    
    influencersList.innerHTML = '';
    
    influencers.forEach(influencer => {
        const influencerEl = document.createElement('div');
        influencerEl.className = 'influencer-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = `${influencer.name}`;
        
        const platform = document.createElement('span');
        platform.className = 'badge platform-badge';
        platform.textContent = influencer.platform;
        
        header.appendChild(title);
        header.appendChild(platform);
        
        const body = document.createElement('div');
        body.className = 'card-body';
        
        const details = document.createElement('div');
        details.className = 'details-grid';
        
        if (influencer.followers > 0) {
            const followersDetail = document.createElement('div');
            followersDetail.innerHTML = `<strong>Followers:</strong> ${influencer.followers.toLocaleString()}`;
            details.appendChild(followersDetail);
        }
        
        if (influencer.engagementRate > 0) {
            const engagementDetail = document.createElement('div');
            engagementDetail.innerHTML = `<strong>Engagement:</strong> ${influencer.engagementRate}%`;
            details.appendChild(engagementDetail);
        }
        
        if (influencer.category) {
            const categoryDetail = document.createElement('div');
            categoryDetail.innerHTML = `<strong>Category:</strong> ${influencer.category}`;
            details.appendChild(categoryDetail);
        }
        
        if (influencer.email) {
            const emailDetail = document.createElement('div');
            emailDetail.innerHTML = `<strong>Email:</strong> ${influencer.email}`;
            details.appendChild(emailDetail);
        }
        
        if (influencer.phone) {
            const phoneDetail = document.createElement('div');
            phoneDetail.innerHTML = `<strong>Phone:</strong> ${influencer.phone}`;
            details.appendChild(phoneDetail);
        }
        
        body.appendChild(details);
        
        const footer = document.createElement('div');
        footer.className = 'card-footer';
        
        const status = document.createElement('span');
        status.className = `badge status-${influencer.status}`;
        status.textContent = influencer.status.toUpperCase();
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteInfluencer(influencer.id));
        
        actions.appendChild(deleteBtn);
        
        footer.appendChild(status);
        footer.appendChild(actions);
        
        influencerEl.appendChild(header);
        influencerEl.appendChild(body);
        influencerEl.appendChild(footer);
        
        influencersList.appendChild(influencerEl);
    });
}

function setupInfluencerForm() {
    const form = document.getElementById('influencerForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('infName').value,
            platform: document.getElementById('infPlatform').value,
            followers: parseInt(document.getElementById('followers').value) || 0,
            engagementRate: parseFloat(document.getElementById('engagementRate').value) || 0,
            category: document.getElementById('category').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };
        
        try {
            const response = await fetch(INFLUENCERS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Influencer added successfully!', 'success');
                form.reset();
                loadInfluencers();
            } else {
                showAlert(data.message || 'Failed to add influencer', 'error');
            }
        } catch (error) {
            console.error('Error adding influencer:', error);
            showAlert('Failed to add influencer', 'error');
        }
    });
}

async function deleteInfluencer(id) {
    if (!confirm('Are you sure you want to delete this influencer?')) {
        return;
    }
    
    try {
        const response = await fetch(`${INFLUENCERS_API}/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Influencer deleted successfully!', 'success');
            loadInfluencers();
        } else {
            showAlert(data.message || 'Failed to delete influencer', 'error');
        }
    } catch (error) {
        console.error('Error deleting influencer:', error);
        showAlert('Failed to delete influencer', 'error');
    }
}

// Utility Functions
function showAlert(message, type) {
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
