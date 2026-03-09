import { db } from '../firebase';
import { ref, set, push } from 'firebase/database';

const now = Date.now();
const hour = 3600000;
const day = 86400000;

export async function seedDemoData() {
  // ===== LOST & FOUND ITEMS =====
  const items = {
    item1: { title: 'Black Leather Wallet', description: 'Lost my black leather wallet with ID cards and some cash near the library entrance', type: 'lost', location: 'Library', status: 'active', userName: 'Rahul Sharma', userId: 'demo1', createdAt: now - 2 * hour },
    item2: { title: 'Wallet found near Library', description: 'Found a black wallet with student ID near library reading room', type: 'found', location: 'Library', status: 'active', userName: 'Priya Singh', userId: 'demo2', createdAt: now - hour },
    item3: { title: 'Blue Water Bottle', description: 'Lost my blue Milton water bottle in the canteen', type: 'lost', location: 'Canteen', status: 'active', userName: 'Amit Kumar', userId: 'demo3', createdAt: now - 3 * hour },
    item4: { title: 'JBL Earbuds', description: 'Found JBL earbuds in Block C classroom 204', type: 'found', location: 'Block C', status: 'active', userName: 'Sneha Reddy', userId: 'demo4', createdAt: now - 5 * hour },
    item5: { title: 'HP Laptop Charger', description: 'Lost my HP laptop charger in Lab 3', type: 'lost', location: 'Lab', status: 'active', userName: 'Dinesh R', userId: 'demo5', createdAt: now - 4 * hour },
    item6: { title: 'Student ID Card', description: 'Found student ID card (CSE dept) near parking', type: 'found', location: 'Parking', status: 'resolved', userName: 'Kavya M', userId: 'demo6', createdAt: now - day },
  };

  // ===== NOTES =====
  const notes = {
    note1: { title: 'Binary Search Trees - Complete Notes', description: 'Comprehensive notes covering BST operations, traversals, and balanced trees', subject: 'DSA', fileType: 'PDF', content: 'Binary Search Tree is a node-based binary tree data structure with properties: left subtree contains nodes with keys less than the parent, right subtree contains nodes with keys greater than the parent...', upvotes: 24, upvotedBy: { demo1: true, demo2: true, demo3: true }, userName: 'Rahul Sharma', userId: 'demo1', createdAt: now - 2 * day },
    note2: { title: 'Java OOP Concepts', description: 'Inheritance, Polymorphism, Abstraction, and Encapsulation explained with examples', subject: 'Java', fileType: 'PDF', content: 'Object-Oriented Programming in Java revolves around 4 pillars: Encapsulation bundles data with methods, Inheritance allows classes to inherit properties...', upvotes: 18, upvotedBy: { demo2: true, demo4: true }, userName: 'Priya Singh', userId: 'demo2', createdAt: now - 3 * day },
    note3: { title: 'MPMC Unit 3 - 8086 Architecture', description: 'Detailed notes on 8086 microprocessor architecture and instruction set', subject: 'MPMC', fileType: 'PPT', content: 'The 8086 microprocessor is a 16-bit processor with 20-bit address bus. It has two units: Bus Interface Unit (BIU) and Execution Unit (EU)...', upvotes: 15, upvotedBy: { demo1: true }, userName: 'Amit Kumar', userId: 'demo3', createdAt: now - 4 * day },
    note4: { title: 'Recursion & Dynamic Programming', description: 'Memoization, tabulation, and common DP patterns with solved problems', subject: 'DSA', fileType: 'PDF', content: 'Dynamic Programming is an optimization technique that solves problems by breaking them into overlapping subproblems...', upvotes: 31, upvotedBy: { demo1: true, demo2: true, demo3: true, demo4: true }, userName: 'Sneha Reddy', userId: 'demo4', createdAt: now - day },
    note5: { title: 'Computer Architecture - Pipeline', description: 'Pipelining concepts, hazards, and solutions in CAO', subject: 'CAO', fileType: 'DOC', content: 'Instruction pipelining is a technique for implementing instruction-level parallelism. It allows overlapping execution of multiple instructions...', upvotes: 12, upvotedBy: {}, userName: 'Kavya M', userId: 'demo6', createdAt: now - 5 * day },
    note6: { title: 'DBMS Normalization Notes', description: '1NF, 2NF, 3NF, BCNF explained with examples and practice problems', subject: 'DBMS', fileType: 'PDF', content: 'Normalization is a process of organizing data to reduce redundancy. First Normal Form (1NF) eliminates repeating groups...', upvotes: 20, upvotedBy: { demo3: true, demo5: true }, userName: 'Dinesh R', userId: 'demo5', createdAt: now - 2 * day },
  };

  // ===== EVENTS =====
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 5);
  const fmt = (d) => d.toISOString().split('T')[0];

  const events = {
    ev1: { title: 'CampusOS Hackathon 2026', description: 'Build innovative campus solutions! 24-hour hackathon with prizes worth ₹50,000. Teams of 3-4 members.', date: fmt(today), time: '09:00', venue: 'Seminar Hall', category: 'Hackathon', going: { demo1: true, demo2: true, demo3: true }, interested: { demo4: true, demo5: true }, goingCount: 3, interestedCount: 2, userName: 'Student Council', userId: 'admin1', createdAt: now - day },
    ev2: { title: 'Web Development Workshop', description: 'Learn React, Firebase, and modern web development. Hands-on workshop with certificate.', date: fmt(tomorrow), time: '14:00', venue: 'Lab 2', category: 'Workshop', going: { demo1: true, demo4: true }, interested: { demo2: true, demo3: true, demo5: true }, goingCount: 2, interestedCount: 3, userName: 'CSE Department', userId: 'admin1', createdAt: now - 2 * day },
    ev3: { title: 'Inter-Department Cricket Tournament', description: 'Annual cricket tournament between departments. Register your team now!', date: fmt(nextWeek), time: '07:00', venue: 'Ground', category: 'Sports', going: { demo3: true }, interested: { demo1: true, demo2: true }, goingCount: 1, interestedCount: 2, userName: 'Sports Committee', userId: 'admin1', createdAt: now - 3 * day },
    ev4: { title: 'AI/ML Seminar by Google', description: 'Guest lecture on latest trends in AI and Machine Learning by Google engineers.', date: fmt(tomorrow), time: '10:00', venue: 'Auditorium', category: 'Seminar', going: { demo1: true, demo2: true, demo4: true, demo5: true }, interested: { demo3: true }, goingCount: 4, interestedCount: 1, userName: 'Tech Club', userId: 'admin1', createdAt: now - day },
    ev5: { title: 'Annual Cultural Fest - Riviera', description: 'Three-day cultural extravaganza with music, dance, drama, and more!', date: fmt(nextWeek), time: '16:00', venue: 'Open Air Theatre', category: 'Cultural', going: { demo1: true, demo2: true, demo3: true, demo4: true, demo5: true, demo6: true }, interested: {}, goingCount: 6, interestedCount: 0, userName: 'Cultural Committee', userId: 'admin1', createdAt: now - 5 * day },
  };

  // ===== COMPLAINTS =====
  const complaints = {
    c1: { title: 'Water supply disruption in Block A', description: 'No water supply since morning in Block A, floors 2 and 3. Students unable to use washrooms.', category: 'Water', hostelBlock: 'Block A', status: 'in-progress', upvotes: 23, upvotedBy: { demo1: true, demo2: true, demo3: true }, userName: 'Rahul Sharma', userId: 'demo1', createdAt: now - 6 * hour },
    c2: { title: 'Broken fan in Room 204', description: 'Ceiling fan in room 204 is making loud noise and not rotating properly. Needs replacement.', category: 'Maintenance', hostelBlock: 'Block B', status: 'submitted', upvotes: 5, upvotedBy: { demo2: true }, userName: 'Amit Kumar', userId: 'demo3', createdAt: now - 2 * hour },
    c3: { title: 'WiFi not working in Block C', description: 'Internet connection has been very slow and disconnecting frequently in Block C for 3 days.', category: 'Internet', hostelBlock: 'Block C', status: 'under-review', upvotes: 18, upvotedBy: { demo1: true, demo3: true, demo4: true }, userName: 'Sneha Reddy', userId: 'demo4', createdAt: now - day },
    c4: { title: 'Mess food quality issue', description: 'Food served in mess today was undercooked and stale. Several students fell sick.', category: 'Food', hostelBlock: 'Block A', status: 'resolved', upvotes: 31, upvotedBy: { demo1: true, demo2: true, demo3: true, demo4: true, demo5: true }, userName: 'Priya Singh', userId: 'demo2', createdAt: now - 2 * day },
    c5: { title: 'Leaking pipe in washroom', description: 'Water pipe leaking in 3rd floor washroom of Girls Hostel. Floor is always wet and slippery.', category: 'Water', hostelBlock: 'Girls Hostel', status: 'in-progress', upvotes: 12, upvotedBy: { demo4: true, demo6: true }, userName: 'Kavya M', userId: 'demo6', createdAt: now - 8 * hour },
    c6: { title: 'Street light not working', description: 'Street light near parking area is not working. Very dark at night, safety concern.', category: 'Electricity', hostelBlock: 'Block D', status: 'submitted', upvotes: 8, upvotedBy: { demo5: true }, userName: 'Dinesh R', userId: 'demo5', createdAt: now - 3 * hour },
  };

  // ===== FEED =====
  const feed = {
    f1: { type: 'notes', title: '📚 Rahul uploaded DSA notes', description: 'Binary Search Trees - Complete Notes', createdAt: now - 2 * hour },
    f2: { type: 'lost-found', title: '🔎 Wallet lost near Library', description: 'Black leather wallet with ID cards', createdAt: now - 2 * hour },
    f3: { type: 'events', title: '📅 Hackathon happening today!', description: 'CampusOS Hackathon 2026 at Seminar Hall', createdAt: now - 3 * hour },
    f4: { type: 'lost-found', title: '✅ Wallet found near Library!', description: 'Found a black wallet in the reading room', createdAt: now - hour },
    f5: { type: 'complaints', title: '🏠 Water issue in Block A', description: '23 students affected - escalated to high priority', createdAt: now - 6 * hour },
    f6: { type: 'notes', title: '📚 Sneha uploaded DP notes', description: 'Recursion & Dynamic Programming patterns', createdAt: now - 4 * hour },
    f7: { type: 'complaints', title: '✅ Mess food complaint resolved', description: 'Management has addressed the food quality issue', createdAt: now - day },
    f8: { type: 'events', title: '📅 Web Dev Workshop tomorrow', description: 'React + Firebase hands-on workshop at Lab 2', createdAt: now - 5 * hour },
  };

  // ===== NOTIFICATIONS =====
  const notifications = {
    n1: { type: 'notes', message: 'New DSA notes uploaded: Binary Search Trees', createdAt: now - 2 * hour },
    n2: { type: 'lost-found', message: 'Lost: Black wallet near Library', createdAt: now - 2 * hour },
    n3: { type: 'events', message: 'Hackathon starts today at 9 AM!', createdAt: now - 3 * hour },
    n4: { type: 'lost-found', message: '🎉 Possible match found for lost wallet!', createdAt: now - hour },
    n5: { type: 'complaints', message: 'Your complaint about water supply is being addressed', createdAt: now - 5 * hour },
    n6: { type: 'notes', message: 'Trending: DP notes by Sneha (31 upvotes)', createdAt: now - 4 * hour },
    n7: { type: 'complaints', message: 'Mess food complaint has been resolved ✅', createdAt: now - day },
    n8: { type: 'events', message: 'Reminder: Web Dev Workshop tomorrow at 2 PM', createdAt: now - hour },
  };

  try {
    await Promise.all([
      set(ref(db, 'items'), items),
      set(ref(db, 'notes'), notes),
      set(ref(db, 'events'), events),
      set(ref(db, 'complaints'), complaints),
      set(ref(db, 'feed'), feed),
      set(ref(db, 'notifications'), notifications),
    ]);
    return true;
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
}
