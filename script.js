// Global variables
let appointmentId = 1;
let timeSlots = {}; // Track booked slots
let regularQueue = []; // FCFS queue
let emergencyQueue = []; // Priority queue

// Period Tracker
function calculatePeriod() {
  const startDate = document.getElementById("start-date").value;
  const cycleLength = 28;
  
  if (!startDate) {
    alert("Please select your last period start date");
    return;
  }
  
  const start = new Date(startDate);
  const nextPeriod = new Date(start);
  nextPeriod.setDate(start.getDate() + cycleLength);

  // Fix: Check if elements exist before setting values
  const currentPeriodElement = document.getElementById('current_period_date');
  const predictedPeriodElement = document.getElementById('predicted_period_date');
  
  if (currentPeriodElement) currentPeriodElement.value = startDate;
  if (predictedPeriodElement) predictedPeriodElement.value = nextPeriod.toISOString().split('T')[0];
  
  const ovulation = new Date(start);
  ovulation.setDate(start.getDate() + 14);
  
  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 3);
  
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 1);
  
  document.getElementById("prediction").innerHTML = `
    <div class="result-card">
      <span class="result-icon">🩸</span>
      <h3 class="result-title">Next Period</h3>
      <p class="result-date">${nextPeriod.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
      })}</p>
    </div>
    <div class="result-card">
      <span class="result-icon">🌟</span>
      <h3 class="result-title">Ovulation Day</h3>
      <p class="result-date">${ovulation.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
      })}</p>
    </div>
    <div class="result-card">
      <span class="result-icon">💕</span>
      <h3 class="result-title">Fertile Window</h3>
      <p class="result-date">${fertileStart.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric' 
      })} - ${fertileEnd.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric' 
      })}</p>
    </div>
  `;
}

// Simple Chatbot
function chatBotReply() {
  const input = document.getElementById("user-input").value.toLowerCase();
  if (!input.trim()) return;
  
  const chatbox = document.getElementById("chatbox");
  
  // Add user message
  const userMessage = document.createElement("div");
  userMessage.className = "chat-message user-message";
  userMessage.textContent = document.getElementById("user-input").value;
  chatbox.appendChild(userMessage);
  
  document.getElementById("user-input").value = "";
  
  // Simple bot responses
  let botResponse = "I'm here to help with your wellness questions! For specific medical concerns, please consult a healthcare provider. 💜";
  
  if (input.includes("period") || input.includes("cycle")) {
    botResponse = "Track your cycle to understand your pattern! Normal cycles are 21-35 days. 🌸";
  } else if (input.includes("pcos")) {
    botResponse = "PCOS is manageable with proper care. Consult a healthcare provider for personalized treatment. 💜";
  } else if (input.includes("anxiety") || input.includes("stress")) {
    botResponse = "Your mental health matters! Consider meditation and professional support if needed. 🤗";
  } else if (input.includes("doctor") || input.includes("appointment")) {
    botResponse = "You can book consultations through our booking section. Regular check-ups are important! 👩‍⚕️";
  }
  
  // Add bot response
  setTimeout(() => {
    const botMessage = document.createElement("div");
    botMessage.className = "chat-message bot-message";
    botMessage.textContent = botResponse;
    chatbox.appendChild(botMessage);
    chatbox.scrollTop = chatbox.scrollHeight;
  }, 1000);
  
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Check if time slot is available
function isSlotAvailable(dateTime) {
  const date = new Date(dateTime);
  const dateKey = date.toISOString().split('T')[0];
  const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  if (!timeSlots[dateKey]) timeSlots[dateKey] = new Set();
  return !timeSlots[dateKey].has(timeKey);
}

// Book a time slot
function bookSlot(dateTime) {
  const date = new Date(dateTime);
  const dateKey = date.toISOString().split('T')[0];
  const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  if (!timeSlots[dateKey]) timeSlots[dateKey] = new Set();
  timeSlots[dateKey].add(timeKey);
}

// FCFS Algorithm - Find next available slot
function fcfsScheduling(requestedDateTime) {
  if (isSlotAvailable(requestedDateTime)) {
    bookSlot(requestedDateTime);
    return {
      dateTime: requestedDateTime,
      status: 'confirmed',
      message: 'Appointment confirmed for your requested time!',
      waitDays: 0
    };
  }
  
  // Find next available slot
  let currentDate = new Date(requestedDateTime);
  for (let days = 1; days <= 30; days++) {
    for (let hour = 9; hour <= 17; hour++) {
      currentDate = new Date(requestedDateTime);
      currentDate.setDate(currentDate.getDate() + days);
      currentDate.setHours(hour, 0, 0, 0);
      
      if (isSlotAvailable(currentDate)) {
        bookSlot(currentDate);
        return {
          dateTime: currentDate.toISOString().slice(0, 16),
          status: 'rescheduled',
          message: `Appointment scheduled ${days} day(s) later due to unavailability.`,
          waitDays: days
        };
      }
    }
  }
  
  return {
    dateTime: null,
    status: 'waitlisted',
    message: 'Added to waitlist. We\'ll notify you when a slot opens.',
    waitDays: -1
  };
}

// Priority Algorithm - Emergency scheduling
function priorityScheduling(requestedDateTime) {
  // Try to find immediate slot (next 4 hours)
  let currentTime = new Date(requestedDateTime);
  for (let hours = 0; hours < 4; hours++) {
    if (isSlotAvailable(currentTime)) {
      bookSlot(currentTime);
      return {
        dateTime: currentTime.toISOString().slice(0, 16),
        status: 'emergency_confirmed',
        message: '🚨 EMERGENCY APPOINTMENT CONFIRMED! Please arrive 15 minutes early.',
        waitHours: hours
      };
    }
    currentTime.setHours(currentTime.getHours() + 1);
  }
  
  // Try to bump a regular appointment (simplified)
  const bumpedSlot = tryBumpAppointment(requestedDateTime);
  if (bumpedSlot) return bumpedSlot;
  
  // Find next available within 48 hours
  currentTime = new Date(requestedDateTime);
  for (let hours = 0; hours < 48; hours++) {
    if (isSlotAvailable(currentTime)) {
      bookSlot(currentTime);
      return {
        dateTime: currentTime.toISOString().slice(0, 16),
        status: 'emergency_scheduled',
        message: `Emergency appointment scheduled in ${hours < 24 ? hours + ' hours' : Math.ceil(hours/24) + ' days'}.`,
        waitHours: hours
      };
    }
    currentTime.setHours(currentTime.getHours() + 1);
  }
  
  return {
    dateTime: null,
    status: 'emergency_waitlist',
    message: '🚨 Added to PRIORITY emergency waitlist. You will be contacted within 2 hours.',
    waitHours: -1
  };
}

// Try to bump a regular appointment for emergency
function tryBumpAppointment(requestedDateTime) {
  const regularAppt = regularQueue.find(apt => 
    apt.status === 'confirmed' && 
    Math.abs(new Date(apt.dateTime) - new Date(requestedDateTime)) < 4 * 60 * 60 * 1000
  );
  
  if (regularAppt) {
    // Reschedule the regular appointment
    const newSlot = fcfsScheduling(regularAppt.dateTime);
    regularAppt.dateTime = newSlot.dateTime;
    regularAppt.status = 'rescheduled_for_emergency';
    
    return {
      dateTime: requestedDateTime,
      status: 'emergency_confirmed',
      message: '🚨 EMERGENCY CONFIRMED! A regular appointment was rescheduled.',
      waitHours: 0,
      bumpedId: regularAppt.id
    };
  }
  
  return null;
}

// Main booking function - FIXED
function bookDoctor(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const bookingType = document.activeElement.value;
  const requestedDateTime = formData.get('appointmentTime');
  const isEmergency = bookingType === 'emergency';

  // Fix: Check if requestedDateTime is valid
  if (!requestedDateTime) {
    alert("Please select an appointment date and time");
    return;
  }

  const result = isEmergency
    ? priorityScheduling(requestedDateTime)
    : fcfsScheduling(requestedDateTime);

  const appointment = {
    id: `${isEmergency ? 'E' : 'R'}${appointmentId++}`,
    name: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phoneNumber'),
    concern: formData.get('healthConcern'),
    dateTime: result.dateTime,
    status: result.status,
    isEmergency: isEmergency,
    bookedAt: new Date().toISOString()
  };

  if (isEmergency) {
    emergencyQueue.push(appointment);
  } else {
    regularQueue.push(appointment);
  }

  // Show loading message
  document.getElementById("booking-message").innerHTML = `
    <div class="booking-success" style="color: #2196F3;">
      📋 Saving appointment...
    </div>
  `;

  // FIXED: PHP Backend Integration
  const backendData = new FormData();
  backendData.append('name', appointment.name || '');
  backendData.append('email', appointment.email || '');
  backendData.append('phone', appointment.phone || '');
  backendData.append('concern', appointment.concern || '');
  backendData.append('appointment_time', appointment.dateTime || '');
  backendData.append('current_period_date', document.getElementById("start-date")?.value || '');
  backendData.append('predicted_period_date', document.getElementById("predicted_period_date")?.value || '');
  backendData.append('booking_type', isEmergency ? 'emergency' : 'regular');

  // Use relative path to PHP file
  fetch("./save_appointment.php", {
    method: "POST",
    body: backendData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      console.log("Backend response:", data);
      displayBookingResult(result, appointment, data);
    })
    .catch(error => {
      console.error('Backend error:', error);
      displayBookingResult(result, appointment, "Could not save to database, but appointment is scheduled locally.");
    });

  event.target.reset();
  console.log('Regular Queue:', regularQueue);
  console.log('Emergency Queue:', emergencyQueue);
}

// Helper function to display booking results
function displayBookingResult(result, appointment, backendMessage) {
  const colors = {
    confirmed: '#4CAF50',
    emergency_confirmed: '#FF5722',
    rescheduled: '#2196F3',
    emergency_scheduled: '#FF9800',
    waitlisted: '#9C27B0',
    emergency_waitlist: '#E91E63'
  };

  const icons = {
    confirmed: '✅',
    emergency_confirmed: '🚨',
    rescheduled: '📅',
    emergency_scheduled: '⚡',
    waitlisted: '⏳',
    emergency_waitlist: '🚨'
  };

  document.getElementById("booking-message").innerHTML = `
    <div class="booking-success" style="border-color: ${colors[result.status]}; color: ${colors[result.status]};">
      ${icons[result.status]} ${result.message}
      <br><br>
      <strong>Appointment Details:</strong><br>
      ID: ${appointment.id}<br>
      Name: ${appointment.name}<br>
      ${result.dateTime ? `Time: ${new Date(result.dateTime).toLocaleString()}<br>` : ''}
      Type: ${appointment.isEmergency ? 'Emergency' : 'Regular'}<br>
      Status: ${result.status.replace('_', ' ').toUpperCase()}<br>
      <br>
      <small style="color: #666;">Database: ${backendMessage}</small>
    </div>
  `;
}

// Community posts
let communityPosts = [
  { content: "Tracking my cycle has helped me understand my mood patterns better! 💪", timestamp: "2 hours ago" },
  { content: "To anyone with PCOS - you're not alone. Small changes make a big difference! 💜", timestamp: "5 hours ago" },
  { content: "Yoga during my period helps with cramps. Highly recommend! 🧘‍♀️", timestamp: "1 day ago" }
];

function postMessage() {
  const content = document.getElementById("anon-post").value.trim();
  if (!content) {
    alert("Please write something to share!");
    return;
  }
  
  communityPosts.unshift({ content, timestamp: "Just now" });
  document.getElementById("anon-post").value = "";
  displayCommunityPosts();
}

function displayCommunityPosts() {
  const feedDiv = document.getElementById("community-feed");
  if (feedDiv) {
    feedDiv.innerHTML = communityPosts.map(post => `
      <div class="community-post">
        <div class="post-content">${post.content}</div>
        <div class="post-meta">Anonymous • ${post.timestamp}</div>
      </div>
    `).join('');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize chatbot
  const chatbox = document.getElementById("chatbox");
  if (chatbox) {
    const welcomeMessage = document.createElement("div");
    welcomeMessage.className = "chat-message bot-message";
    welcomeMessage.textContent = "Hi! 👋 I'm your AI wellness companion. Ask me about periods, mental health, nutrition, and wellness!";
    chatbox.appendChild(welcomeMessage);
  }

  // Initialize community posts
  displayCommunityPosts();

  // Add enter key listener for chat
  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") chatBotReply();
    });
  }

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
});
