import type { TranslationKeys } from "./ro";

export const en: TranslationKeys = {
  // Navigation
  nav: {
    home: "Home",
    properties: "Properties",
    complexes: "Complexes",
    projects: "Projects",
    about: "About Us",
    contact: "Contact",
    favorites: "Favorites",
    login: "Login",
    admin: "Admin",
    calculator: "Mortgage Calculator",
    blog: "Blog",
    faq: "FAQ",
    whyUs: "Why Us",
    career: "Career",
    shortTermRentals: "Short-Term Rentals",
  },
  
  // Hero Section
  hero: {
    title: "Find Your Dream Home",
    subtitle: "Explore the best properties in Bucharest and surroundings",
    searchPlaceholder: "Search by location, price or features...",
    searchButton: "Search",
    viewProperties: "View Properties",
    contactUs: "Contact Us",
  },
  
  // Properties
  properties: {
    title: "Properties",
    subtitle: "Discover our property portfolio",
    rooms: "rooms",
    surface: "sqm",
    price: "Price",
    location: "Location",
    viewDetails: "View Details",
    scheduleViewing: "Schedule Viewing",
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    forSale: "For Sale",
    forRent: "For Rent",
    filters: "Filters",
    sortBy: "Sort by",
    priceAsc: "Price: Low to High",
    priceDesc: "Price: High to Low",
    newest: "Newest",
    noResults: "No properties found",
  },
  
  // Complexes
  complexes: {
    title: "Residential Complexes",
    subtitle: "New development projects",
    apartments: "apartments",
    startingFrom: "Starting from",
    completionDate: "Completion date",
    viewComplex: "View Complex",
  },
  
  // Contact
  contact: {
    title: "Contact Us",
    subtitle: "We're here to help",
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    send: "Send",
    sending: "Sending...",
    success: "Message sent successfully!",
    error: "Error sending. Please try again.",
    address: "Address",
    workingHours: "Working Hours",
    weekdays: "Monday - Friday",
    weekend: "Saturday - Sunday",
  },
  
  // About
  about: {
    title: "About Us",
    subtitle: "Experience and professionalism in real estate",
    description: "With over 10 years of experience in the Bucharest real estate market, we provide consulting and brokerage services for buying, selling and renting properties.",
    mission: "Our Mission",
    missionText: "To find the perfect property for each client, providing personalized and transparent services.",
    values: "Our Values",
    experience: "Years of experience",
    clients: "Happy clients",
    transactions: "Completed transactions",
  },
  
  // Services
  services: {
    title: "Services",
    subtitle: "What we offer",
    buying: "Buying",
    buyingDesc: "We help you find the perfect property for your needs.",
    selling: "Selling",
    sellingDesc: "We sell your property at the best price, in the shortest time.",
    renting: "Renting",
    rentingDesc: "Complete rental services for landlords and tenants.",
    consulting: "Consulting",
    consultingDesc: "Professional advice for real estate investments.",
  },
  
  // Footer
  footer: {
    description: "Real estate agency with experience in Bucharest and surroundings.",
    quickLinks: "Quick Links",
    contact: "Contact",
    followUs: "Follow Us",
    rights: "All rights reserved",
    privacy: "Privacy Policy",
    terms: "Terms and Conditions",
    cookies: "Cookie Policy",
  },
  
  // Common
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    currency: "EUR",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
  },
  
  // Mortgage Calculator
  calculator: {
    title: "Mortgage Calculator",
    subtitle: "Calculate your monthly payment",
    propertyPrice: "Property price",
    downPayment: "Down payment",
    loanTerm: "Loan term",
    years: "years",
    interestRate: "Annual interest rate",
    monthlyPayment: "Monthly payment",
    totalPayment: "Total payment",
    totalInterest: "Total interest",
    calculate: "Calculate",
  },
  
  // Schedule Viewing
  viewing: {
    title: "Schedule a Viewing",
    subtitle: "Fill out the form to schedule a visit",
    preferredDate: "Preferred date",
    preferredTime: "Preferred time",
    yourName: "Your name",
    yourPhone: "Your phone",
    yourEmail: "Your email",
    additionalMessage: "Additional message",
    schedule: "Schedule",
    success: "Viewing scheduled successfully!",
  },
  
  // Auth
  auth: {
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    loginButton: "Sign In",
    registerButton: "Create Account",
    logout: "Logout",
  },

  // FAQ
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Answers to common questions",
    stillQuestions: "Didn't find the answer you were looking for?",
    contactUs: "Contact us",
    helpText: "Our team is here to help! Contact us and we'll answer all your questions.",
    items: [
      { question: "What are the agency's commissions?", answer: "The standard commission for our services is competitive and transparent. It varies depending on the type and value of the property. We will present all details and costs for our services from the first consultation, with no hidden fees." },
      { question: "How long does the property selling process take?", answer: "The average selling duration depends on several factors: location, price, property condition, and market conditions. On average, a well-evaluated property sells in 2-3 months. Our team uses effective marketing strategies to accelerate the process." },
      { question: "How do you evaluate a property?", answer: "The evaluation is based on a detailed analysis that includes: location, usable area, property condition, amenities and finishes, similar prices in the area, and current market trends. We offer free evaluations for properties we list." },
      { question: "What documents are required to sell a property?", answer: "The main documents include: property deed (purchase-sale contract), fiscal certificate, energy certificate, urbanism certificate, land registry extract, and proof of paid taxes. We will assist you in preparing all necessary documents." },
      { question: "Do you offer legal assistance services?", answer: "Yes, we collaborate with notaries and lawyers experienced in real estate transactions. We can recommend trusted specialists and assist you throughout the entire process, from document verification to signing the final contract." },
      { question: "Can I view properties on weekends?", answer: "Of course! We understand that your schedule may be busy during the week. We organize viewings on weekends as well, by appointment. We are flexible and adapt to our clients' needs." },
      { question: "How do you ensure that listed properties are verified?", answer: "All properties in our portfolio go through a rigorous verification process: we validate property documents, check the technical condition of the building, confirm information provided by the owner, and ensure all presented data is correct and up to date." },
      { question: "Do you offer rental services?", answer: "Yes, we offer complete rental services, both for landlords and tenants. We manage the entire process: property promotion, tenant selection, creditworthiness verification, contract preparation, and assistance throughout the rental period." },
      { question: "How can I list my property on your website?", answer: "The process is simple: contact us by phone, email, or fill out the form on the website. A consultant will visit for property evaluation, we'll take professional photos and create the listing. The property will be promoted on our website and all relevant platforms." },
      { question: "Do you offer real estate investment consulting?", answer: "Yes, we offer consulting services for investors interested in the Bucharest and Ilfov real estate market. We can help you identify profitable opportunities, analyze investment profitability, and make informed decisions based on real market data." },
    ],
  },

  // Career
  career: {
    title: "Careers",
    subtitle: "Join our team",
    openPositions: "Open Positions",
    noPositions: "No positions available at the moment",
    apply: "Apply",
    benefits: "Benefits",
    requirements: "Requirements",
    badge: "Join Our Team",
    heroTitle: "Build a Career as a Real Estate Agent",
    heroSubtitle: "At MVA Imobiliare, we are constantly looking for passionate professionals who want to be part of a dynamic team oriented towards excellence in premium real estate.",
    benefitsList: [
      { title: "Professional Growth", description: "Continuous training and development programs" },
      { title: "Motivating Environment", description: "Work with premium properties and sophisticated clients" },
      { title: "Competitive Rewards", description: "Attractive salary and bonus system" },
    ],
    formTitle: "Application Form",
    formSubtitle: "Fill out the form below and we will get back to you within 48 hours",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    position: "Desired Position",
    selectPosition: "Select position",
    experience: "Experience",
    selectExperience: "Select experience",
    uploadCv: "Upload CV (optional)",
    uploadCvText: "Click to upload CV (PDF, DOC - max 5MB)",
    coverLetter: "Cover Letter",
    coverLetterPlaceholder: "Write a few lines about your motivation to join the MVA Imobiliare team...",
    submit: "Submit Application",
    submitting: "Submitting application...",
    successTitle: "Application submitted successfully!",
    successMessage: "Thank you for your interest. We will contact you soon.",
    errorTitle: "Submission error",
    errorMessage: "An error occurred. Please try again.",
    fileTooLarge: "File too large",
    fileTooLargeMessage: "CV cannot exceed 5MB",
    invalidFormat: "Invalid format",
    invalidFormatMessage: "Please upload a PDF or DOC file",
    positions: {
      "agent-imobiliar": "Real Estate Agent",
    },
    experienceLevels: {
      "fara-experienta": "No Experience",
      "0-2-ani": "0-2 years",
      "2-5-ani": "2-5 years",
      "5plus-ani": "Over 5 years",
    },
    validationErrors: {
      nameMin: "Name must contain at least 3 characters",
      emailInvalid: "Invalid email",
      phoneInvalid: "Invalid phone number",
      positionRequired: "Select desired position",
      experienceRequired: "Select experience",
      coverLetterMin: "Cover letter must contain at least 50 characters",
    },
  },

  // Blog
  blog: {
    title: "Blog",
    subtitle: "Real estate news and updates",
    readMore: "Read article",
    recentPosts: "Recent Posts",
    noArticles: "No articles",
    publishedOn: "Published on",
  },

  // Why Choose Us
  whyChooseUs: {
    title: "Why Choose Us",
    subtitle: "Reasons why clients choose us",
    badge: "Your Trusted Agency",
    heroTitle: "Why",
    heroTitleHighlight: "Choose Us?",
    heroSubtitle: "Your trusted partners for smart real estate investments in west Bucharest. Experience, transparency, and guaranteed results.",
    contactWhatsApp: "Contact us on WhatsApp",
    discoverAdvantages: "Discover Advantages",
    
    // Selling section
    sellingTitle: "Why choose",
    sellingTitleHighlight: "MVA IMOBILIARE",
    sellingTitleEnd: "to sell your property?",
    sellingSubtitle: "Our experience, track record, and brand power put us in the perfect position to get the best price for your property.",
    
    sellingPoints: [
      { title: "Buyer magnet", text: "Thanks to advanced marketing techniques, we attract an impressive number of potential buyers to our database, giving you a distinct advantage when you intend to sell your home." },
      { title: "We evaluate correctly to get the best price", text: "We achieve an average of 97% of the asking price for every property we sell.", text2: "We visit many properties every month, so we have a deep understanding of market values and how we can get the best price. Our advanced technology continues to give us insight into pricing and real estate market information." },
      { title: "A unique support team", text: "Our support staff helps us maintain the highest level of customer service.", text2: "We are always available – Due to buyers' busy schedules, 38% of our viewings take place in the evenings and weekends. This is a time when many agents are not active." },
      { title: "In-house expertise saves time", text: "98% of our properties are live online, within 48 hours.", text2: "We don't waste precious time. We can have the property fully promoted online within 48 hours of photographing the property." },
      { title: "Maximum exposure", text: "We ensure total coverage, both online and offline.", text2: "mvaimobiliare.ro attracts quality traffic, thanks to ongoing optimization efforts. We will also promote your property on imobiliare.ro, imopedia.ro, magazinuldecase.ro and more property and listing sites, as well as through email marketing techniques, all at no additional cost." },
      { title: "Highest ethical standards", text: "Our agents work closely with our customer relations department to provide the best services for our clients. This helps us build long-term partnerships and relationships." },
      { title: "We do our job well", text: "Our people are trained to be the best professionals in the industry. They will work passionately on your behalf to get you the best possible price and provide you with outstanding service." },
    ],
    
    // Buying section
    buyingTitle: "Why choose",
    buyingTitleEnd: "to find your new home?",
    buyingSubtitle: "With thousands of updated properties for sale, providing more exceptional options and more viewing hours for convenient appointments, we are the first choice for buyers.",
    
    buyingPoints: [
      { title: "Thousands of properties", text: "With over 15,000 properties in our database, updated at least once a month, you can be sure that no matter your needs, we have exactly what you're looking for." },
      { title: "Extended working hours", text: "Our agents are available Monday through Saturday. Additionally, our phone lines are open seven days a week.", text2: "In order to secure a property, we recommend a faster viewing. We accompany you to the viewing, ready to immediately answer any questions and provide advice if needed." },
      { title: "Detailed property information", text: "Providing you with as much information as possible before a viewing, our website and a portal opened especially for you are renowned for their easy-to-use search features and detailed information." },
      { title: "Email alerts", text: "In addition to receiving property details - when you register with us you can choose to be instantly notified by email as new properties become available." },
      { title: "Expert consultancy", text: "As a real estate broker in Bucharest, we are able to offer you local knowledge and expert advice, regardless of your requirements." },
    ],
    
    // Services section
    servicesTitle: "Complete",
    servicesTitleHighlight: "Services",
    servicesSubtitle: "Everything you need for a successful real estate transaction",
    servicesList: [
      "Free and professional evaluations",
      "Complete legal assistance",
      "Negotiation on your behalf",
      "Mortgage support",
      "Real estate investment consulting",
      "Property management",
      "Post-sale follow-up",
    ],
    
    // Testimonials section
    testimonialsTitle: "What",
    testimonialsTitleHighlight: "Clients Say",
    testimonialsSubtitle: "Real testimonials from families we've helped find their home",
    testimonials: [
      { name: "Maria & Alexandru P.", text: "Exceptional professionalism and dedication. They helped us find the perfect apartment in Chiajna in just 2 weeks!" },
      { name: "Cristina R.", text: "Complete transparency and comprehensive services. I confidently recommend the MVA Imobiliare team." },
      { name: "Mihai D.", text: "The best agency in the west area! They guided me perfectly through the entire purchase process." },
    ],
    
    // CTA section
    ctaTitle: "Ready to Find",
    ctaTitleHighlight: "Your Perfect Home?",
    ctaSubtitle: "Let's discuss your real estate dreams. The consultation is free and without obligation.",
    viewProperties: "View Properties",
    
    // Legacy translations
    experience: "Proven Experience",
    experienceText: "Over 10 years of experience in the local real estate market.",
    network: "Extensive Network",
    networkText: "Access to a wide range of properties and developers.",
    personalized: "Personalized Approach",
    personalizedText: "Each client receives individual attention.",
    transparency: "Complete Transparency",
    transparencyText: "Open and honest communication at every stage.",
    support: "Full Support",
    supportText: "We guide you from the first visit to key handover.",
    results: "Proven Results",
    resultsText: "Hundreds of satisfied clients and successfully completed transactions.",
  },

  // Cookie Consent
  cookies: {
    message: "We use cookies to improve your experience on our site.",
    accept: "Accept",
    decline: "Decline",
    learnMore: "Learn more",
  },

  // Mobile App
  mobile: {
    home: "Home",
    search: "Search",
    complexes: "Complexes",
    favorites: "Favorites",
    account: "Account",
    welcome: "Welcome!",
    welcomeSubtitle: "Discover dream properties",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    language: "Language",
    contactInfo: "Contact Info",
    savedProperties: "Saved Properties",
    noFavorites: "No saved properties",
    exploreProperties: "Explore properties",
  },

  // Onboarding
  onboarding: {
    welcome: "Welcome to MVA Imobiliare",
    welcomeDesc: "Discover the best properties in the area",
    search: "Search Properties",
    searchDesc: "Find your perfect home with our advanced filters",
    favorites: "Save Favorites",
    favoritesDesc: "Mark your preferred properties for later",
    contact: "Easy Contact",
    contactDesc: "One click and you're connected with us",
    getStarted: "Get Started",
    skip: "Skip",
    next: "Continue",
  },
};
