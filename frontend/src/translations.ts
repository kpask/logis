// ============================================================
// Logis — Translations
// Structure: key → language → text
// Fallback: EN is the required fallback for any missing translation.
// ============================================================

export const translations = {
  // ── Shared / Common ────────────────────────────────────────
  loading: { EN: "Loading…", LT: "Kraunama…" },
  loadingSettings: { EN: "Loading settings…", LT: "Kraunami nustatymai…" },
  loadingWorkplaces: {
    EN: "Loading workplaces…",
    LT: "Kraunamos darbo vietos…",
  },
  loadingWorkplace: { EN: "Loading workplace…", LT: "Kraunama darbo vieta…" },
  loadingProject: { EN: "Loading project…", LT: "Kraunamas projektas…" },
  loadingInvitations: {
    EN: "Loading invitations…",
    LT: "Kraunami pakvietimai…",
  },
  loadingInvitation: {
    EN: "Loading invitation…",
    LT: "Kraunamas pakvietimas…",
  },
  loadingWorkCalendar: {
    EN: "Loading work calendar…",
    LT: "Kraunamas darbo kalendorius…",
  },
  loadingCompany: { EN: "Loading company…", LT: "Kraunama įmonė…" },
  save: { EN: "Save changes", LT: "Išsaugoti pakeitimus" },
  saving: { EN: "Saving…", LT: "Išsaugoma…" },
  cancel: { EN: "Cancel", LT: "Atšaukti" },
  delete: { EN: "Delete", LT: "Ištrinti" },
  deleting: { EN: "Deleting…", LT: "Trinama…" },
  create: { EN: "Create", LT: "Sukurti" },
  creating: { EN: "Creating…", LT: "Kuriama…" },
  edit: { EN: "Edit", LT: "Redaguoti" },
  backToDashboard: { EN: "Back to dashboard", LT: "Atgal į pagrindinį" },
  noLocationSet: { EN: "No location set", LT: "Vieta nenustatyta" },
  savingGeneric: { EN: "Saving…", LT: "Išsaugoma…" },

  // ── App Layout / Navigation ────────────────────────────────
  navDashboard: { EN: "Dashboard", LT: "Pagrindinis" },
  navWorkplaces: { EN: "Workplaces", LT: "Darbo vietos" },
  navInvites: { EN: "Invites", LT: "Pakvietimai" },
  navProfile: { EN: "Profile", LT: "Profilis" },
  navSettings: { EN: "Settings", LT: "Nustatymai" },
  signOut: { EN: "Sign out", LT: "Atsijungti" },
  welcomeUser: { EN: "Welcome, {name}", LT: "Sveiki, {name}" },

  // ── Login Page ─────────────────────────────────────────────
  loginTitle: { EN: "Sign in", LT: "Prisijungti" },
  loginSubtitle: {
    EN: "Welcome back. Enter your credentials to continue.",
    LT: "Sveiki sugrįžę. Įveskite savo duomenis, norėdami tęsti.",
  },
  loginEmail: { EN: "Email", LT: "El. paštas" },
  loginPassword: { EN: "Password", LT: "Slaptažodis" },
  loginSubmit: { EN: "Sign in", LT: "Prisijungti" },
  loginSubmitting: { EN: "Signing in…", LT: "Prisijungiama…" },
  loginErrorCredentials: {
    EN: "Please enter your email and password.",
    LT: "Prašome įvesti el. paštą ir slaptažodį.",
  },
  loginNoAccount: { EN: "Don't have an account?", LT: "Neturite paskyros?" },
  loginCreateAccount: { EN: "Create an account", LT: "Sukurti paskyrą" },

  // ── Signup Page ────────────────────────────────────────────
  signupTitle: { EN: "Create your account", LT: "Sukurkite savo paskyrą" },
  signupSubtitle: {
    EN: "Start tracking your work in minutes.",
    LT: "Pradėkite sekti savo darbą per kelias minutes.",
  },
  signupName: { EN: "Name", LT: "Vardas" },
  signupLastName: { EN: "Last name", LT: "Pavardė" },
  signupUsername: { EN: "Username", LT: "Vartotojo vardas" },
  signupEmail: { EN: "Email", LT: "El. paštas" },
  signupPassword: { EN: "Password", LT: "Slaptažodis" },
  signupConfirmPassword: {
    EN: "Confirm password",
    LT: "Patvirtinti slaptažodį",
  },
  signupSubmit: { EN: "Sign up", LT: "Registruotis" },
  signupSubmitting: { EN: "Creating account…", LT: "Kuriama paskyra…" },
  signupErrorNameRequired: {
    EN: "Name is required.",
    LT: "Vardas yra privalomas.",
  },
  signupErrorLastNameRequired: {
    EN: "Last name is required.",
    LT: "Pavardė yra privaloma.",
  },
  signupErrorUsernameShort: {
    EN: "Username must be at least 3 characters.",
    LT: "Vartotojo vardas turi būti bent 3 simbolių.",
  },
  signupErrorEmailInvalid: {
    EN: "Please enter a valid email.",
    LT: "Prašome įvesti teisingą el. paštą.",
  },
  signupErrorPasswordShort: {
    EN: "Password must be at least 8 characters.",
    LT: "Slaptažodis turi būti bent 8 simbolių.",
  },
  signupErrorPasswordMatch: {
    EN: "Passwords do not match.",
    LT: "Slaptažodžiai nesutampa.",
  },
  signupHasAccount: {
    EN: "Already have an account?",
    LT: "Jau turite paskyrą?",
  },
  signupSignIn: { EN: "Sign in", LT: "Prisijungti" },
  signupPasswordPlaceholder: {
    EN: "At least 8 characters",
    LT: "Bent 8 simboliai",
  },
  signupConfirmPasswordPlaceholder: {
    EN: "Repeat your password",
    LT: "Pakartokite slaptažodį",
  },

  // ── Settings Page ───────────────────────────────────────────
  settingsTitle: { EN: "Settings", LT: "Nustatymai" },
  settingsSubtitle: {
    EN: "Manage your preferences",
    LT: "Valdykite savo nustatymus",
  },
  settingsLanguage: { EN: "Language", LT: "Kalba" },
  settingsLanguageHelp: {
    EN: "Choose the language used across the app.",
    LT: "Pasirinkite programėlės kalbą.",
  },
  settingsSaving: { EN: "Saving…", LT: "Išsaugoma…" },
  languageEnglish: { EN: "English", LT: "English" },
  languageLithuanian: { EN: "Lietuvių", LT: "Lietuvių" },

  // ── Dashboard Page ─────────────────────────────────────────
  dashboardTitle: { EN: "Dashboard", LT: "Pagrindinis" },
  dashboardNoCompanyTitle: {
    EN: "You're not part of a company yet.",
    LT: "Jūs dar nepriklausote jokiai įmonei.",
  },
  dashboardNoCompanyDesc: {
    EN: "Create a company to start managing workplaces, projects, and time tracking. Joining an existing company is coming soon.",
    LT: "Sukurkite įmonę, kad pradėtumėte valdyti darbo vietas, projektus ir darbo laiko apskaitą. Prisijungimas prie esamos įmonės bus galimas netrukus.",
  },
  dashboardCreateCompany: { EN: "Create company", LT: "Sukurti įmonę" },
  dashboardJoinCompany: { EN: "Join company", LT: "Prisijungti prie įmonės" },
  dashboardYourCompany: { EN: "Your company", LT: "Jūsų įmonė" },
  dashboardCompany: { EN: "Company", LT: "Įmonė" },
  dashboardMembers: { EN: "Company members", LT: "Įmonės nariai" },
  dashboardNoMembers: { EN: "No members yet.", LT: "Narių dar nėra." },
  dashboardNoMembersDesc: {
    EN: "Invite people to your company and they will show up here.",
    LT: "Pakvieskite žmones į savo įmonę ir jie bus rodomi čia.",
  },
  dashboardInviteMember: { EN: "Invite member", LT: "Pakviesti narį" },
  dashboardViewCalendar: { EN: "View calendar", LT: "Žiūrėti kalendorių" },
  dashboardPromoteToManager: {
    EN: "Promote to manager",
    LT: "Paskirti vadovu",
  },
  dashboardDemoteToWorker: {
    EN: "Demote to worker",
    LT: "Pažeminti į darbuotojus",
  },
  dashboardKickFromCompany: {
    EN: "Kick from company",
    LT: "Pašalinti iš įmonės",
  },
  dashboardTransferOwnership: {
    EN: "Transfer ownership",
    LT: "Perduoti nuosavybę",
  },
  roleOwner: { EN: "Owner", LT: "Savininkas" },
  roleManager: { EN: "Manager", LT: "Vadovas" },
  roleWorker: { EN: "Worker", LT: "Darbuotojas" },
  companyActions: { EN: "Company actions", LT: "Įmonės veiksmai" },
  memberActions: { EN: "Member actions", LT: "Nario veiksmai" },

  // ── Dashboard: Create Company Modal ────────────────────────
  createCompanyTitle: { EN: "Create company", LT: "Sukurti įmonę" },
  createCompanyDesc: {
    EN: "You'll become the first manager of this company.",
    LT: "Tapsite pirmuoju šios įmonės vadovu.",
  },
  createCompanyNameLabel: { EN: "Company name", LT: "Įmonės pavadinimas" },
  createCompanyNamePlaceholder: {
    EN: "e.g. Acme Corporation",
    LT: "pvz., UAB „Inovacijos“",
  },
  createCompanyErrorShort: {
    EN: "Company name must be at least 5 characters.",
    LT: "Įmonės pavadinimas turi būti bent 5 simbolių.",
  },
  createCompanySubmit: { EN: "Create company", LT: "Sukurti įmonę" },
  createCompanySubmitting: { EN: "Creating…", LT: "Kuriama…" },

  // ── Dashboard: Edit Company Modal ──────────────────────────
  editCompanyTitle: { EN: "Edit company", LT: "Redaguoti įmonę" },
  editCompanyDesc: {
    EN: "Update your company name and default work settings.",
    LT: "Atnaujinkite įmonės pavadinimą ir numatytuosius darbo nustatymus.",
  },
  editCompanyNameLabel: { EN: "Company name", LT: "Įmonės pavadinimas" },
  editCompanyLunchLabel: {
    EN: "Default lunch length (minutes)",
    LT: "Numatytoji pietų pertraukos trukmė (minutėmis)",
  },
  editCompanyStartTimeLabel: {
    EN: "Default start time",
    LT: "Numatytasis pradžios laikas",
  },
  editCompanyEndTimeLabel: {
    EN: "Default end time",
    LT: "Numatytasis pabaigos laikas",
  },
  editCompanySubmit: { EN: "Save changes", LT: "Išsaugoti pakeitimus" },
  editCompanySubmitting: { EN: "Saving…", LT: "Išsaugoma…" },

  // ── Dashboard: Invite Member Modal ─────────────────────────
  inviteMemberTitle: { EN: "Invite member", LT: "Pakviesti narį" },
  inviteMemberDesc: {
    EN: "Send an invitation to join your company. The recipient will receive an email with a link to accept.",
    LT: "Išsiųskite pakvietimą prisijungti prie jūsų įmonės. Gavėjas gaus el. laišką su nuoroda priimti pakvietimą.",
  },
  inviteMemberEmailLabel: { EN: "Email", LT: "El. paštas" },
  inviteMemberEmailPlaceholder: {
    EN: "colleague@company.com",
    LT: "kolega@imone.lt",
  },
  inviteMemberSubmit: { EN: "Send invitation", LT: "Siųsti pakvietimą" },
  inviteMemberSubmitting: { EN: "Sending…", LT: "Siunčiama…" },
  inviteMemberErrorRequired: {
    EN: "Email is required.",
    LT: "El. paštas yra privalomas.",
  },
  inviteMemberSuccess: {
    EN: "An invitation has been created for {email}.",
    LT: "Pakvietimas sukurtas el. paštui {email}.",
  },

  // ── Dashboard: Confirm Dialogs ─────────────────────────────
  confirmTransferOwnership: {
    EN: "Transfer ownership of {company} to {name} {lastname}? You will become a manager.",
    LT: "Perduoti {company} nuosavybę {name} {lastname}? Jūs tapsite vadovu.",
  },
  confirmPromote: {
    EN: "Promote {name} {lastname} to manager?",
    LT: "Paskirti {name} {lastname} vadovu?",
  },
  confirmDemote: {
    EN: "Demote {name} {lastname} to worker? They will lose manager privileges.",
    LT: "Pažeminti {name} {lastname} į darbuotojus? Jie praras vadovo teises.",
  },
  confirmKick: {
    EN: "Remove {name} {lastname} from {company}? They will lose access to all workplaces and projects, and their project assignments will be ended.",
    LT: "Pašalinti {name} {lastname} iš {company}? Jie praras prieigą prie visų darbo vietų bei projektų, o jų priskirti projektai bus užbaigti.",
  },

  // ── Workplaces Page ────────────────────────────────────────
  workplacesTitle: { EN: "Workplaces", LT: "Darbo vietos" },
  workplacesCount: {
    EN: "{count, select, 1 {# workplace} other {# workplaces}}",
    LT: "{count, select, 1 {# darbo vieta} other {# darbo vietų}}",
  },
  workplacesNoCompanyTitle: {
    EN: "You're not part of a company yet.",
    LT: "Jūs dar nepriklausote jokiai įmonei.",
  },
  workplacesNoCompanyDesc: {
    EN: "Create a company from the dashboard to start managing workplaces.",
    LT: "Sukurkite įmonę pagrindiniame ekrane, kad pradėtumėte valdyti darbo vietas.",
  },
  workplacesNoWorkplacesTitle: {
    EN: "No workplaces yet.",
    LT: "Darbo vietų dar nėra.",
  },
  workplacesNoWorkplacesDesc: {
    EN: "Create a workplace to start organizing projects.",
    LT: "Sukurkite darbo vietą, kad pradėtumėte organizuoti projektus.",
  },
  workplacesCreateWorkplace: {
    EN: "Create workplace",
    LT: "Sukurti darbo vietą",
  },
  workplacesDeleteWorkplace: { EN: "Delete", LT: "Ištrinti" },
  workplacesDeleteConfirm: {
    EN: 'Delete "{name}"? This will permanently remove the workplace and all of its projects and time entries.',
    LT: "Ištrinti „{name}“? Tai negrįžtamai pašalins šią darbo vietą, visus jos projektus ir laiko įrašus.",
  },

  // ── Workplaces: Create Workplace Modal ─────────────────────
  createWorkplaceTitle: { EN: "Create workplace", LT: "Sukurti darbo vietą" },
  createWorkplaceDesc: {
    EN: "A workplace is a physical or virtual location where projects happen.",
    LT: "Darbo vieta yra fizinė arba virtuali vieta, kurioje vykdomi projektai.",
  },
  createWorkplaceNameLabel: { EN: "Name", LT: "Pavadinimas" },
  createWorkplaceNamePlaceholder: {
    EN: "e.g. Vilnius Office",
    LT: "pvz., Vilniaus biuras",
  },
  createWorkplaceNameRequired: {
    EN: "Workplace name is required.",
    LT: "Darbo vietos pavadinimas yra privalomas.",
  },
  createWorkplaceSubmit: { EN: "Create workplace", LT: "Sukurti darbo vietą" },
  createWorkplaceSubmitting: { EN: "Creating…", LT: "Kuriama…" },
  createWorkplaceSetLocation: {
    EN: "Set a location for this workplace",
    LT: "Nustatyti šios darbo vietos lokaciją",
  },
  createWorkplaceRadiusLabel: {
    EN: "Clock-in fence radius: {radius} m",
    LT: "Žymėjimosi zonos spindulys: {radius} m",
  },
  createWorkplaceRadiusHelp: {
    EN: "Workers must be within this distance for their time entry to be logged as on-site. Entries outside are still allowed but flagged.",
    LT: "Darbuotojai turi būti šiuo atstumu, kad jų laiko įrašas būtų pažymėtas kaip atliktas darbo vietoje. Įrašai už šios zonos ribų leidžiami, bet bus atitinkamai pažymėti.",
  },

  // ── Workplace Page ─────────────────────────────────────────
  workplaceNoAccessTitle: {
    EN: "You don't have access to this workplace.",
    LT: "Jūs neturite prieigos prie šios darbo vietos.",
  },
  workplaceNoAccessDesc: {
    EN: "You're not a member of this workplace. Ask your company manager to add you to it.",
    LT: "Nesate šios darbo vietos narys. Paprašykite įmonės vadovo jus pridėti.",
  },
  workplaceNotFound: { EN: "Workplace not found.", LT: "Darbo vieta nerasta." },
  workplaceLoading: { EN: "Loading workplace…", LT: "Kraunama darbo vieta…" },
  workplaceEdit: { EN: "Edit", LT: "Redaguoti" },
  workplaceDelete: { EN: "Delete workplace", LT: "Ištrinti darbo vietą" },
  workplaceDeleting: { EN: "Deleting…", LT: "Trinama…" },
  workplaceDeleteConfirm: {
    EN: 'Delete "{name}"? This will permanently remove the workplace and all of its projects and time entries.',
    LT: "Ištrinti „{name}“? Tai negrįžtamai pašalins šią darbo vietą, visus jos projektus ir laiko įrašus.",
  },
  deleteWorkplace: { EN: "Delete workplace", LT: "Ištrinti darbo vietą" },
  deleteProjectTitle: { EN: "Delete project", LT: "Ištrinti projektą" },
  loggedSuffix: { EN: "{time} logged", LT: "{time} registruota" },

  // ── Workplace: Edit Workplace Modal ────────────────────────
  editWorkplaceTitle: { EN: "Edit workplace", LT: "Redaguoti darbo vietą" },
  editWorkplaceDesc: {
    EN: "Update the name, location and clock-in fence of this workplace.",
    LT: "Atnaujinkite šios darbo vietos pavadinimą, lokaciją ir žymėjimosi zoną.",
  },
  editWorkplaceNameLabel: {
    EN: "Workplace name",
    LT: "Darbo vietos pavadinimas",
  },
  editWorkplaceLocationLabel: {
    EN: "Location — click the map or search for the address",
    LT: "Vieta — spustelėkite žemėlapį arba ieškokite adreso",
  },
  editWorkplaceRadiusLabel: {
    EN: "Clock-in fence radius: {radius} m",
    LT: "Žymėjimosi zonos spindulys: {radius} m",
  },
  editWorkplaceRadiusHelp: {
    EN: "Workers must be within this distance of the location for their time entry to be logged as on-site. Entries outside are still allowed but flagged.",
    LT: "Darbuotojai turi būti šiuo atstumu nuo nurodytos vietos, kad jų laiko įrašas būtų pažymėtas kaip atliktas darbo vietoje. Įrašai už šios zonos ribų leidžiami, bet bus atitinkamai pažymėti.",
  },
  editWorkplaceNameRequired: {
    EN: "Workplace name is required.",
    LT: "Darbo vietos pavadinimas yra privalomas.",
  },
  editWorkplaceSubmit: { EN: "Save changes", LT: "Išsaugoti pakeitimus" },
  editWorkplaceSubmitting: { EN: "Saving…", LT: "Išsaugoma…" },
  editWorkplaceRadiusDesc: {
    EN: "Workers must be within this distance for their time entry to be logged as on-site. Entries outside are still allowed but flagged.",
    LT: "Darbuotojai turi būti šiuo atstumu nuo nurodytos vietos, kad jų laiko įrašas būtų pažymėtas kaip atliktas darbo vietoje. Įrašai už šios zonos ribų leidžiami, bet bus atitinkamai pažymėti.",
  },

  // ── Workplace: Projects ────────────────────────────────────
  projectsTitle: { EN: "Projects", LT: "Projektai" },
  projectsNoProjectsTitle: {
    EN: "No projects in this workplace yet.",
    LT: "Šioje darbo vietoje projektų dar nėra.",
  },
  projectsNoProjectsDesc: {
    EN: "Create a project to start tracking time. If you don't see a create button, ask a company manager to create projects.",
    LT: "Sukurkite projektą, kad pradėtumėte sekti laiką. Jei nematote kūrimo mygtuko, paprašykite įmonės vadovo sukurti projektą.",
  },
  projectsCreateProject: { EN: "Create project", LT: "Sukurti projektą" },
  projectsDeleteProject: { EN: "Delete", LT: "Ištrinti" },
  projectDeleteConfirm: {
    EN: 'Delete "{name}"? This will permanently remove the project and all of its time entries.',
    LT: "Ištrinti „{name}“? Tai negrįžtamai pašalins šį projektą ir visus jo laiko įrašus.",
  },

  // ── Workplace: Create Project Modal ────────────────────────
  createProjectTitle: { EN: "Create project", LT: "Sukurti projektą" },
  createProjectDesc: {
    EN: "Project in {name}",
    LT: "Projektas darbo vietoje {name}",
  },
  createProjectNameLabel: { EN: "Project name", LT: "Projekto pavadinimas" },
  createProjectNamePlaceholder: {
    EN: "e.g. Website redesign",
    LT: "pvz., Svetainės atnaujinimas",
  },
  createProjectNameRequired: {
    EN: "Project name is required.",
    LT: "Projekto pavadinimas yra privalomas.",
  },
  createProjectStartDateLabel: { EN: "Start date", LT: "Pradžios data" },
  createProjectDeadlineLabel: { EN: "Deadline", LT: "Terminas" },
  createProjectSubmit: { EN: "Create project", LT: "Sukurti projektą" },
  createProjectSubmitting: { EN: "Creating…", LT: "Kuriama…" },

  // ── Workplace: Edit Project Modal ─────────────────────────
  editProjectTitle: { EN: "Edit project", LT: "Redaguoti projektą" },
  editProjectDesc: {
    EN: "Update details for {name}.",
    LT: "Atnaujinkite projekto „{name}“ informaciją.",
  },
  editProjectNameLabel: { EN: "Project name", LT: "Projekto pavadinimas" },
  editProjectStartDateLabel: { EN: "Start date", LT: "Pradžios data" },
  editProjectDeadlineLabel: { EN: "Deadline", LT: "Terminas" },
  editProjectStatusLabel: { EN: "Status", LT: "Statusas" },
  editProjectSubmit: { EN: "Save changes", LT: "Išsaugoti pakeitimus" },
  editProjectSubmitting: { EN: "Saving…", LT: "Išsaugoma…" },

  // ── Project Status Badges ──────────────────────────────────
  projectStatusPending: { EN: "Pending", LT: "Laukiantis" },
  projectStatusActive: { EN: "Active", LT: "Aktyvus" },
  projectStatusCompleted: { EN: "Completed", LT: "Baigtas" },
  projectStatusCancelled: { EN: "Cancelled", LT: "Atšauktas" },
  projectStatusOnHold: { EN: "On hold", LT: "Sustabdytas" },

  // ── Project Page ───────────────────────────────────────────
  projectNoAccess: { EN: "Project not found.", LT: "Projektas nerastas." },
  projectEdit: { EN: "Edit", LT: "Redaguoti" },
  projectDelete: { EN: "Delete", LT: "Ištrinti" },
  projectDeleting: { EN: "Deleting…", LT: "Trinama…" },
  projectTimerRunning: { EN: "Currently working", LT: "Dabar dirbama" },
  projectNoTimer: { EN: "No timer running", LT: "Laikmatis neįjungtas" },
  projectStartTimer: { EN: "Start timer", LT: "Paleisti laikmatį" },
  projectStopTimer: { EN: "Stop timer", LT: "Sustabdyti laikmatį" },
  projectCheckingLocation: { EN: "Checking location…", LT: "Tikrinama vieta…" },
  projectStopping: { EN: "Stopping…", LT: "Stabdoma…" },
  projectTimerOutsideWarning: {
    EN: "Timer started outside the work area — this entry is flagged as logged outside.",
    LT: "Laikmatis paleistas už darbo zonos ribų — šis įrašas pažymėtas kaip registruotas kitoje vietoje.",
  },
  projectWorkersTitle: { EN: "Workers", LT: "Darbuotojai" },
  projectNoWorkersTitle: {
    EN: "No workers assigned yet.",
    LT: "Darbuotojų dar nepriskirta.",
  },
  projectNoWorkersDesc: {
    EN: "Assign company members to this project so they can track time on it.",
    LT: "Priskirkite įmonės narius šiam projektui, kad jie galėtų sekti savo laiką.",
  },
  projectAssignWorker: { EN: "Assign worker", LT: "Priskirti darbuotoją" },
  projectRemoveWorker: { EN: "Remove", LT: "Pašalinti" },
  projectRemoveWorkerConfirm: {
    EN: "Remove {name} {lastname} from {project}?",
    LT: "Pašalinti {name} {lastname} iš {project}?",
  },
  projectLogTime: { EN: "Log time", LT: "Registruoti laiką" },
  projectLoggedTimeBadge: {
    EN: "{time} logged",
    LT: "{time} registruota",
  },

  // ── Project: Assign Worker Modal ───────────────────────────
  assignWorkerTitle: { EN: "Assign worker", LT: "Priskirti darbuotoją" },
  assignWorkerDesc: {
    EN: "Add a company member to {project}.",
    LT: "Pridėkite įmonės narį prie {project}.",
  },
  assignWorkerLabel: { EN: "Company member", LT: "Įmonės narys" },
  assignWorkerPlaceholder: { EN: "Select a member…", LT: "Pasirinkite narį…" },
  assignWorkerSubmit: { EN: "Assign", LT: "Priskirti" },
  assignWorkerSubmitting: { EN: "Assigning…", LT: "Priskiriama…" },
  assignWorkerAllAssigned: {
    EN: "All company members are already assigned to this project.",
    LT: "Visi įmonės nariai jau priskirti šiam projektui.",
  },

  // ── Project: Add Time Entry Modal ──────────────────────────
  addEntryTitle: { EN: "Add time entry", LT: "Pridėti laiko įrašą" },
  addEntryDesc: {
    EN: "Log time for {date} on {project}.",
    LT: "Registruokite laiką projektui {project} (data: {date}).",
  },
  addEntryWorkerLabel: { EN: "Worker", LT: "Darbuotojas" },
  addEntryWorkerPlaceholder: {
    EN: "Select a worker…",
    LT: "Pasirinkite darbuotoją…",
  },
  addEntryStartLabel: { EN: "Start", LT: "Pradžia" },
  addEntryEndLabel: { EN: "End", LT: "Pabaiga" },
  addEntrySubmit: { EN: "Add entry", LT: "Pridėti įrašą" },
  addEntrySubmitting: { EN: "Adding…", LT: "Pridedama…" },
  addEntryErrorTimesRequired: {
    EN: "Please provide both start and end times.",
    LT: "Prašome nurodyti ir pradžios, ir pabaigos laiką.",
  },
  addEntryErrorEndBeforeStart: {
    EN: "End time must be after start time.",
    LT: "Pabaigos laikas turi būti vėlesnis už pradžios laiką.",
  },

  // ── Project: Edit Time Entry Modal ─────────────────────────
  editEntryTitle: { EN: "Edit time entry", LT: "Redaguoti laiko įrašą" },
  editEntryRunningWarning: {
    EN: "This entry is still running and cannot be edited.",
    LT: "Šis įrašas vis dar aktyvus, todėl negali būti redaguojamas.",
  },
  editEntryDelete: { EN: "Delete", LT: "Ištrinti" },
  editEntryDeleting: { EN: "Deleting…", LT: "Trinama…" },
  editEntrySubmit: { EN: "Save", LT: "Išsaugoti" },
  editEntrySubmitting: { EN: "Saving…", LT: "Išsaugoma…" },
  editEntryDeleteConfirm: {
    EN: "Delete this time entry?",
    LT: "Ištrinti šį laiko įrašą?",
  },

  // ── Time Entry Status Badges ───────────────────────────────
  entryStatusLogged: { EN: "Logged", LT: "Užregistruota" },
  entryStatusOutside: { EN: "Outside", LT: "Išorėje" },
  entryStatusManual: { EN: "Manual", LT: "Rankiniu būdu" },
  entryStatusEdited: { EN: "Edited", LT: "Redaguota" },

  // ── Clock In Modal ─────────────────────────────────────────
  clockInTitle: { EN: "Outside the work area", LT: "Už darbo zonos ribų" },
  clockInDesc: {
    EN: "You can still start the timer, but this time entry will be flagged as logged outside.",
    LT: "Vis tiek galite paleisti laikmatį, bet šis įrašas bus pažymėtas kaip atliktas ne darbo vietoje.",
  },
  clockInConfirm: {
    EN: "Start timer anyway",
    LT: "Vis tiek paleisti laikmatį",
  },
  clockInReasonOutside: {
    EN: "You are {distance} m from {workplace} — outside the work area.",
    LT: "Jūs esate {distance} m nuo {workplace} — už darbo zonos ribų.",
  },
  clockInReasonUnavailable: {
    EN: "Your location is unavailable — the entry will be flagged as logged outside.",
    LT: "Jūsų vieta neprieinama — įrašas bus pažymėtas kaip užregistruotas kitoje vietoje.",
  },
  clockInWorkplaceFallback: { EN: "the workplace", LT: "ši darbo vieta" },

  // ── User Work Calendar Modal ───────────────────────────────
  workCalendarTitle: {
    EN: "Work calendar — {name} {lastname}",
    LT: "Darbo kalendorius — {name} {lastname}",
  },
  workCalendarDesc: {
    EN: "Logged time across all projects. Click a marked day to see its entries.",
    LT: "Užregistruotas laikas visuose projektuose. Spustelėkite pažymėtą dieną, kad pamatytumėte jos įrašus.",
  },
  workCalendarNoTimeTitle: {
    EN: "No time logged on this day.",
    LT: "Šią dieną laikas nebuvo registruotas.",
  },
  workCalendarNoTimeDesc: {
    EN: "Click any worked day in the calendar to see its entries.",
    LT: "Spustelėkite bet kurią darbo dieną kalendoriuje, kad pamatytumėte jos įrašus.",
  },
  workCalendarLoggedBadge: {
    EN: "{time} logged",
    LT: "{time} registruota",
  },
  workCalendarTotal: { EN: "Total", LT: "Iš viso" },
  workCalendarProjectFallback: {
    EN: "Project #{id}",
    LT: "Projektas #{id}",
  },

  // ── Profile Page ───────────────────────────────────────────
  profileTitle: { EN: "Profile", LT: "Profilis" },
  profileSubtitle: {
    EN: "Your account information",
    LT: "Jūsų paskyros informacija",
  },
  profileEmail: { EN: "Email", LT: "El. paštas" },
  profileName: { EN: "Name", LT: "Vardas" },
  profileLastName: { EN: "Last name", LT: "Pavardė" },
  profileUsername: { EN: "Username", LT: "Vartotojo vardas" },
  profileRole: { EN: "Role", LT: "Rolė" },
  profileCompany: { EN: "Company", LT: "Įmonė" },
  profileLoadingCompany: { EN: "Loading company…", LT: "Kraunama įmonė…" },
  profileNoCompany: {
    EN: "You're not part of a company yet.",
    LT: "Jūs dar nepriklausote jokiai įmonei.",
  },

  // ── Invites Page ───────────────────────────────────────────
  invitesTitle: { EN: "Invites", LT: "Pakvietimai" },
  invitesSubtitle: {
    EN: "Invitations to your company and sent to you",
    LT: "Pakvietimai į jūsų įmonę bei gauti pakvietimai",
  },
  invitesInviteTitle: {
    EN: "Invite to your company",
    LT: "Pakviesti į savo įmonę",
  },
  invitesInviteDesc: {
    EN: "Email delivery is not set up yet — copy the invitation link and share it with the person you're inviting.",
    LT: "El. laiškų siuntimas dar nesukonfigūruotas — nukopijuokite pakvietimo nuorodą ir pasidalinkite ja su norimu pakviesti asmeniu.",
  },
  invitesCreatedFor: {
    EN: "Invitation created for {email}. It is valid until {expiry}.",
    LT: "Pakvietimas sukurtas el. paštui {email}. Jis galios iki {expiry}.",
  },
  invitesCopyLink: { EN: "Copy link", LT: "Kopijuoti nuorodą" },
  invitesCopied: { EN: "Copied!", LT: "Nukopijuota!" },
  invitesSendInvitation: { EN: "Send invitation", LT: "Siųsti pakvietimą" },
  invitesSending: { EN: "Sending…", LT: "Siunčiama…" },
  invitesEmailRequired: {
    EN: "Email is required.",
    LT: "El. paštas yra privalomas.",
  },
  invitesSentTitle: { EN: "Sent invitations", LT: "Išsiųsti pakvietimai" },
  invitesSentEmptyTitle: {
    EN: "No invitations sent yet",
    LT: "Išsiųstų pakvietimų dar nėra",
  },
  invitesSentEmptyDesc: {
    EN: "Invite someone by email above — they'll receive a link to join your company.",
    LT: "Pakvieskite ką nors el. paštu aukščiau — jie gaus nuorodą prisijungti prie jūsų įmonės.",
  },
  invitesValidUntil: { EN: "Valid until {date}", LT: "Galioja iki {date}" },
  invitesMyInvitesTitle: { EN: "My invitations", LT: "Mano pakvietimai" },
  invitesEmptyTitle: { EN: "No invitations", LT: "Pakvietimų nėra" },
  invitesEmptyDesc: {
    EN: "When a company manager invites you, it will show up here.",
    LT: "Kai įmonės vadovas jus pakvies, tai bus rodoma čia.",
  },
  invitesAccept: { EN: "Accept", LT: "Priimti" },
  invitesAccepting: { EN: "Accepting…", LT: "Priimama…" },
  invitesAlreadyInCompany: {
    EN: "You're already in a company",
    LT: "Jūs jau esate įmonėje",
  },

  // ── Invitation Status Badges ───────────────────────────────
  invitationStatusPending: { EN: "Pending", LT: "Laukiantis" },
  invitationStatusAccepted: { EN: "Accepted", LT: "Priimtas" },
  invitationStatusDeclined: { EN: "Declined", LT: "Atmestas" },
  invitationStatusExpired: { EN: "Expired", LT: "Nebegaliojantis" },
  invitationStatusCancelled: { EN: "Cancelled", LT: "Atšauktas" },

  // ── Invitation Page ────────────────────────────────────────
  invitationNotFoundTitle: {
    EN: "This invitation could not be found.",
    LT: "Šis pakvietimas nerastas.",
  },
  invitationNotFoundDesc: {
    EN: "The link may be incorrect or the invitation has been removed. Ask a company manager to send you a new invitation.",
    LT: "Nuoroda gali būti neteisinga arba pakvietimas buvo pašalintas. Paprašykite įmonės vadovo išsiųsti jums naują pakvietimą.",
  },
  invitationNetworkErrorTitle: {
    EN: "Unable to load the invitation.",
    LT: "Nepavyko įkelti pakvietimo.",
  },
  invitationNetworkErrorDesc: {
    EN: "Could not reach the server. Please check your internet connection and try again.",
    LT: "Nepavyko pasiekti serverio. Patikrinkite interneto ryšį ir bandykite dar kartą.",
  },
  invitationGenericErrorTitle: {
    EN: "Something went wrong.",
    LT: "Kažkas nutiko.",
  },
  invitationExpiredTitle: {
    EN: "This invitation has expired.",
    LT: "Šis pakvietimas nebegalioja.",
  },
  invitationExpiredDesc: {
    EN: "Ask a company manager to send you a new invitation.",
    LT: "Paprašykite įmonės vadovo išsiųsti jums naują pakvietimą.",
  },
  invitationUsedTitle: {
    EN: "This invitation has already been used.",
    LT: "Šis pakvietimas jau panaudotas.",
  },
  invitationUsedDesc: {
    EN: "Ask a company manager to send you a new invitation if you believe this is a mistake.",
    LT: "Jei manote, kad tai klaida, paprašykite įmonės vadovo atsiųsti naują pakvietimą.",
  },
  invitationUnavailableTitle: {
    EN: "This invitation is no longer valid.",
    LT: "Šis pakvietimas nebegalioja.",
  },
  invitationUnavailableDesc: {
    EN: "Ask a company manager to send you a new invitation.",
    LT: "Paprašykite įmonės vadovo išsiųsti jums naują pakvietimą.",
  },
  invitationNewUserTitle: {
    EN: "You've been invited to join {company}",
    LT: "Buvote pakviesti prisijungti prie {company}",
  },
  invitationNewUserSentTo: {
    EN: "This invitation was sent to: {email}",
    LT: "Šis pakvietimas buvo išsiųstas el. paštui: {email}",
  },
  invitationNewUserCreateAccount: {
    EN: "Create your Logis account to join {company}.",
    LT: "Sukurkite Logis paskyrą, kad prisijungtumėte prie {company}.",
  },
  invitationNewUserSubmit: { EN: "Create account", LT: "Sukurti paskyrą" },
  invitationNewUserSubmitting: {
    EN: "Creating account…",
    LT: "Kuriama paskyra…",
  },
  invitationExistingUserTitle: {
    EN: "You've been invited to join {company}",
    LT: "Buvote pakviesti prisijungti prie {company}",
  },
  invitationExistingUserDesc: {
    EN: "You already have a Logis account. Sign in with your account — you can accept this invitation from the Invites tab afterwards.",
    LT: "Jūs jau turite Logis paskyrą. Prisijunkite — priimti šį pakvietimą galėsite iš pakvietimų skilties.",
  },
  invitationGoToSignIn: { EN: "Go to sign in", LT: "Eiti į prisijungimą" },

  // ── Table Column Headers ───────────────────────────────────
  colProject: { EN: "Project", LT: "Projektas" },
  colStatus: { EN: "Status", LT: "Statusas" },
  colStartDate: { EN: "Start date", LT: "Pradžios data" },
  colDeadline: { EN: "Deadline", LT: "Terminas" },
  colActions: { EN: "Actions", LT: "Veiksmai" },
  colStart: { EN: "Start", LT: "Pradžia" },
  colEnd: { EN: "End", LT: "Pabaiga" },
  colWorked: { EN: "Worked", LT: "Dirbta" },
  colWorker: { EN: "Worker", LT: "Darbuotojas" },
  colMember: { EN: "Member", LT: "Narys" },
  colUsername: { EN: "Username", LT: "Vartotojo vardas" },
  colRole: { EN: "Role", LT: "Rolė" },
  colTotal: { EN: "Total", LT: "Iš viso" },

  // ── Empty State Titles & Descriptions ──────────────────────
  emptyNoTimeLogged: {
    EN: "No time logged on this day.",
    LT: "Šią dieną laikas nebuvo registruotas.",
  },
  emptyNoTimeLoggedDesc: {
    EN: "Click any worked day in the calendar to see its entries.",
    LT: "Spustelėkite bet kurią darbo dieną kalendoriuje, kad pamatytumėte jos įrašus.",
  },
  emptyNoTimeLoggedWorkplaceDesc: {
    EN: "Click any worked day in the calendar to see its entries across this workplace's projects.",
    LT: "Spustelėkite bet kurią darbo dieną kalendoriuje, kad pamatytumėte šios darbo vietos projektų įrašus.",
  },
  emptyNoMembersTitle: { EN: "No members yet.", LT: "Narių dar nėra." },
  emptyNoMembersDesc: {
    EN: "Invite people to your company and they will show up here.",
    LT: "Pakvieskite narius ir jie bus rodomi čia.",
  },

  // ── Shared Component Text (Calendar, Dropdown, MemberSelect) ─
  // ── Calendar ────────────────────────────────────────────────
  weekdayMon: { EN: "Mon", LT: "Pr" },
  weekdayTue: { EN: "Tue", LT: "An" },
  weekdayWed: { EN: "Wed", LT: "Tr" },
  weekdayThu: { EN: "Thu", LT: "Kt" },
  weekdayFri: { EN: "Fri", LT: "Pt" },
  weekdaySat: { EN: "Sat", LT: "Št" },
  weekdaySun: { EN: "Sun", LT: "Sk" },
  calendarPrev: { EN: "Prev", LT: "Atp." },
  calendarNext: { EN: "Next", LT: "Kita" },
  calendarLegendWorked: { EN: "Worked", LT: "Dirbta" },
  calendarLegendWeekendHoliday: {
    EN: "Weekend / Holiday",
    LT: "Savaitgalis / šventė",
  },
  calendarLegendSelected: { EN: "Selected", LT: "Pasirinkta" },
  calendarWorkedThisMonth: { EN: "Worked this month", LT: "Dirbta šį mėnesį" },

  // ── Dropdown & Context Menu ─────────────────────────────────
  dropdownActionsDefault: { EN: "Actions", LT: "Veiksmai" },
  memberFilterLabel: { EN: "Member", LT: "Narys" },
  memberFilterAll: { EN: "All members", LT: "Visi nariai" },
  workplaceActionsMenuTitle: {
    EN: "Workplace actions",
    LT: "Darbo vietos veiksmai",
  },

  // ── Misc Fallbacks ──────────────────────────────────────────
  companyFallback: { EN: "the company", LT: "įmonė" },
  projectWorkplaceFallback: { EN: "Workplace", LT: "Darbo vieta" },
  editProjectFallback: { EN: "this project", LT: "šį projektą" },
  projectNoAccessBack: { EN: "Back", LT: "Atgal" },
  projectStartedLabel: { EN: "Started", LT: "Pradėta" },
  projectDeadlineLabel: { EN: "Deadline", LT: "Terminas" },
  projectFallback: { EN: "this project", LT: "šį projektą" },

  // ── Dashboard (additional) ──────────────────────────────────
  dashboardWelcome: {
    EN: "Welcome, {name}. Let's get you set up.",
    LT: "Sveiki, {name}. Sisukurkime jūsų paskyrą.",
  },
  comingSoon: { EN: "Coming soon", LT: "Netruko išleidimo" },
  dashboardLoading: {
    EN: "Loading your workspace…",
    LT: "Kraunamas jūsų darbas…",
  },
  dashboardNoWorkplacesDesc: {
    EN: "Create your first workplace to start organizing projects. If you don't see a create button, ask your company manager to add you to a workplace.",
    LT: "Sukurkite pirmąją darbo vietą, kad pradėtumėte organizuoti projektus. Jei nematote kūrimo mygtuko, paprašykite įmonės vadovo pridėti jus prie darbo vietos.",
  },
  workplaceSingular: { EN: "workplace", LT: "darbo vieta" },
  workplacePlural: { EN: "workplaces", LT: "darbo vietos" },
  editCompanyNamePlaceholder: {
    EN: "e.g. Acme Corporation",
    LT: 'pvz., UAB „Inovacijos"',
  },

  // ── Workplace Page (additional) ─────────────────────────────
  workplaceTimeTracking: { EN: "Time tracking", LT: "Laiko sekimas" },
  timeTrackingTitle: { EN: "Work calendar", LT: "Darbo kalendorius" },
  timeTrackingNoEntriesTitle: {
    EN: "No time logged on this day.",
    LT: "Nėra laiko įrašų šiai dienai.",
  },
  timeTrackingNoEntriesDesc: {
    EN: "Click any worked day in the calendar to see its entries across this workplace's projects.",
    LT: "Spustelėkite bet kurią dirbtą dieną kalendoriuje, kad pamatytumėte šios darbo vietos projektų įrašus šiai dienai.",
  },

  // ── Project Page (additional) ──────────────────────────────
  emptyNoTimeLoggedProjectDesc: {
    EN: "Click any worked day in the calendar to see its entries, or start the timer above to log time for today.",
    LT: "Spustelėkite bet kurią dirbtą dieną kalendoriuje, kad pamatytumėte šios dienos įrašus, arba paleiskite laikmatį aukščiau, kad užregistruotumėte laiką šią dieną.",
  },
  editProjectNamePlaceholder: {
    EN: "e.g. Website redesign",
    LT: "pvz., Svetainės perdizainavimas",
  },
  editEntryTimeRange: { EN: "{start} → {end}", LT: "{start} → {end}" },

  // ── MapPicker ────────────────────────────────────────────────
  mapSearchPlaceholder: { EN: "Search address…", LT: "Ieškoti adreso…" },
  mapSearching: { EN: "Working…", LT: "Ieškoma…" },
  mapSearchButton: { EN: "Search", LT: "Ieškoti" },
  mapLookingUpLocation: { EN: "Looking up location…", LT: "Ieškamas adresas…" },
  mapCoordsFormat: {
    EN: "Lat: {lat}, Lng: {lng}{address}",
    LT: "Plat.: {lat}, Ilg.: {lng}{address}",
  },

  // ── Form Placeholders ────────────────────────────────────────
  loginEmailPlaceholder: { EN: "you@company.com", LT: "jus@imone.lt" },
  signupNamePlaceholder: { EN: "Karolis", LT: "Karolis" },
  signupLastNamePlaceholder: { EN: "Petrauskas", LT: "Petrauskas" },
  signupUsernamePlaceholder: { EN: "karolis", LT: "karolis" },
  signupEmailPlaceholder: { EN: "you@company.com", LT: "jus@imone.lt" },
  invitesEmailPlaceholder: {
    EN: "colleague@company.com",
    LT: "kolega@imone.lt",
  },

  // ── Errors ───────────────────────────────────────────────────
  errorGeneric: {
    EN: "Something went wrong. Please try again.",
    LT: "Kažkas nepavyko. Bandykite dar kartą.",
  },
  errorNetwork: {
    EN: "Unable to reach the server. Please check your connection.",
    LT: "Nepavyko pasiekti serverio. Patikrinkite interneto ryšį.",
  },
  workplaceErrorShortName: {
    EN: "Workplace name is required.",
    LT: "Darbo vietos pavadinimas yra privalomas.",
  },
} as const;

export type TranslationKey = keyof typeof translations;
