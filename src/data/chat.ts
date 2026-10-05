export const quickQuestions = [
  "How do I submit a new project?",
  "What does approval status mean?",
  "How can I update MRV data?",
  "Who do I contact for CRZ clearance?",
];

type ChatEntry = { match: RegExp; reply: string; followUps: string[] };

const chatResponses: ChatEntry[] = [
  {
    match: /submit.*project|new project/i,
    reply:
      "Go to Projects → New Project, fill in the site and intervention details, then submit for nodal office review.",
    followUps: ["What documents do I need to attach?", "How long does review take?"],
  },
  {
    match: /approval status|approved|pending|rejected/i,
    reply:
      "Pending means it's awaiting nodal office review, Approved means it's cleared, and Rejected means it needs resubmission with corrections.",
    followUps: ["How do I resubmit a rejected project?", "Who approves submissions?"],
  },
  {
    match: /mrv data|update.*mrv/i,
    reply:
      "Open MRV Data from the sidebar, select the site record, and use the Edit action to update monitoring values.",
    followUps: ["Can I bulk upload MRV data?", "Who can edit MRV records?"],
  },
  {
    match: /crz|clearance/i,
    reply:
      "CRZ clearance queries are handled by your state's Coastal Zone Management Authority (CZMA), listed under each project's details.",
    followUps: ["How do I contact my state CZMA?", "What is the clearance timeline?"],
  },
  {
    match: /documents.*attach|attach.*document/i,
    reply: "Typically you'll need site photos, a project proposal PDF, and any prior clearance letters.",
    followUps: ["How do I submit a new project?"],
  },
  {
    match: /how long.*review|review take/i,
    reply: "Standard review takes 7-10 working days, depending on the state nodal office workload.",
    followUps: ["What does approval status mean?"],
  },
  {
    match: /resubmit.*rejected/i,
    reply: "Open the project, address the reviewer's comments, and use the Resubmit action on the project detail page.",
    followUps: ["What does approval status mean?"],
  },
  {
    match: /who approves/i,
    reply: "Submissions are approved by the state nodal office, with final clearance from MoEFCC for CRZ-sensitive sites.",
    followUps: ["Who do I contact for CRZ clearance?"],
  },
  {
    match: /bulk upload/i,
    reply: "Yes — use the Import option on the MRV Data page to upload a CSV of monitoring records.",
    followUps: ["How can I update MRV data?"],
  },
  {
    match: /who can edit mrv/i,
    reply: "Only the implementing agency and state nodal office reviewers can edit MRV records.",
    followUps: ["How can I update MRV data?"],
  },
  {
    match: /contact.*czma/i,
    reply: "CZMA contact details are listed under Projects → project detail → Location panel for each state.",
    followUps: ["Who do I contact for CRZ clearance?"],
  },
  {
    match: /clearance timeline/i,
    reply: "CRZ clearance typically takes 4-6 weeks depending on the category of the coastal zone.",
    followUps: ["Who do I contact for CRZ clearance?"],
  },
];

const fallbackEntry: ChatEntry = {
  reply:
    "Thanks for your message — a support agent will follow up shortly. You can also check the Documents section for guides.",
  followUps: quickQuestions,
  match: /.^/,
};

export function getChatReply(question: string): { reply: string; followUps: string[] } {
  const found = chatResponses.find((entry) => entry.match.test(question));
  const entry = found ?? fallbackEntry;
  return { reply: entry.reply, followUps: entry.followUps };
}
