/**
 * Election Guide India — Knowledge Base
 * Comprehensive, neutral information about Indian elections.
 */

const ElectionKnowledge = {

    // ===== VOTER REGISTRATION =====
    registration: {
        keywords: ['register', 'registration', 'enroll', 'enrollment', 'sign up', 'voter id', 'epic', 'form 6', 'nvsp', 'voter list', 'electoral roll'],
        response: {
            title: '📝 Voter Registration Process',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'To register as a voter in India, you need to fill <em>Form 6</em> either online through the NVSP portal or offline at your nearest Electoral Registration Office. You must be an Indian citizen and at least 18 years old on the qualifying date.'
                },
                {
                    heading: 'Step-by-Step Guide',
                    list: [
                        '<strong>Step 1:</strong> Visit the NVSP portal at <em>voters.eci.gov.in</em> or download the Voter Helpline App',
                        '<strong>Step 2:</strong> Click on "New Voter Registration" and select <em>Form 6</em>',
                        '<strong>Step 3:</strong> Fill in personal details — name, date of birth, address, and family details',
                        '<strong>Step 4:</strong> Upload documents — passport-size photo, age proof, and address proof',
                        '<strong>Step 5:</strong> Submit the form and note your reference number',
                        '<strong>Step 6:</strong> A Booth Level Officer (BLO) may visit for verification',
                        '<strong>Step 7:</strong> Once approved, your name appears in the Electoral Roll and you receive your EPIC (Voter ID card)'
                    ]
                },
                {
                    heading: 'Required Documents',
                    list: [
                        'Passport-size photograph',
                        'Age proof (Birth certificate, 10th marksheet, passport)',
                        'Address proof (Aadhaar, utility bill, bank passbook, ration card)'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Tip:</strong> The qualifying date for age eligibility is January 1st, April 1st, July 1st, or October 1st of the year (four qualifying dates per year as per recent amendments).'
                },
                {
                    heading: 'Next Step',
                    content: 'Would you like help checking if you\'re already registered, or guidance on filling the online form?'
                }
            ]
        }
    },

    // ===== FIRST TIME VOTER =====
    firstTimeVoter: {
        keywords: ['turned 18', 'just turned 18', 'first time', 'first vote', 'new voter', '18 years', 'eligible', 'young voter', 'first-time'],
        response: {
            title: '🎂 Congratulations on Becoming Eligible to Vote!',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'Since you\'ve turned 18, you are now eligible to participate in Indian elections! The first step is to register yourself as a voter through the NVSP portal or the Voter Helpline App.'
                },
                {
                    heading: 'What You Need to Do',
                    list: [
                        '<strong>Step 1:</strong> Check the qualifying date — you must be 18 on or before the qualifying date (Jan 1, Apr 1, Jul 1, or Oct 1)',
                        '<strong>Step 2:</strong> Download the <em>Voter Helpline App</em> or visit <em>voters.eci.gov.in</em>',
                        '<strong>Step 3:</strong> Fill <em>Form 6</em> (New Voter Registration)',
                        '<strong>Step 4:</strong> Upload your passport photo, age proof (like 10th marksheet or birth certificate), and address proof',
                        '<strong>Step 5:</strong> Submit and track your application status online',
                        '<strong>Step 6:</strong> Once verified, you\'ll receive your <em>EPIC (Voter ID) card</em>'
                    ]
                },
                {
                    infoBox: true,
                    type: 'green',
                    content: '✅ <strong>Good to know:</strong> Registration is completely free and you can track your application status anytime on the NVSP portal using your reference number.'
                },
                {
                    heading: 'Next Step',
                    content: 'Would you like me to walk you through the online registration form step-by-step, or help you gather the right documents?'
                }
            ]
        }
    },

    // ===== ELECTION TIMELINE =====
    timeline: {
        keywords: ['timeline', 'election schedule', 'election phases', 'election dates', 'when is election', 'election process', 'how election works', 'entire election', 'election stages', 'process'],
        response: {
            title: '📅 The Election Timeline',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'Indian general elections follow a structured timeline managed by the Election Commission of India (ECI). The process typically spans 6-8 weeks from announcement to results.'
                },
                {
                    heading: 'Phase-by-Phase Breakdown',
                    list: [
                        '<strong>Phase 1 — Announcement:</strong> The ECI announces election dates, and the <em>Model Code of Conduct (MCC)</em> comes into effect immediately. This limits what the ruling government can announce or promise.',
                        '<strong>Phase 2 — Nominations (7 days):</strong> Candidates file nomination papers. The papers are scrutinized, and candidates can withdraw within 2 days after scrutiny.',
                        '<strong>Phase 3 — Campaigning (~2 weeks):</strong> Political parties and candidates campaign through rallies, media, and door-to-door canvassing. Campaign must stop <em>48 hours before polling</em> (silence period).',
                        '<strong>Phase 4 — Polling Day:</strong> Voters cast their votes using EVMs at designated polling booths. Voting typically runs from 7 AM to 6 PM. Voter turnout is tracked in real-time.',
                        '<strong>Phase 5 — Counting Day:</strong> Usually 2-3 days after the final phase of polling. Votes are counted at designated counting centers. Results are declared constituency by constituency.'
                    ]
                },
                {
                    infoBox: true,
                    type: 'blue',
                    content: '📌 <strong>Note:</strong> In large elections like the Lok Sabha, voting happens in multiple phases across different states over several weeks to ensure security and logistical management.'
                },
                {
                    heading: 'Next Step',
                    content: 'Would you like to know more about any specific phase, or understand what happens during the Model Code of Conduct?'
                }
            ]
        }
    },

    // ===== VOTING PROCESS =====
    votingProcess: {
        keywords: ['voting process', 'how to vote', 'polling booth', 'polling day', 'cast vote', 'voting day', 'how voting works', 'booth', 'what happens on polling', 'vote kaise'],
        response: {
            title: '🗳️ The Voting Process on Polling Day',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'On polling day, you visit your assigned polling booth, verify your identity, receive a ballot slip, cast your vote on the EVM, and verify it on the VVPAT machine. The entire process takes about 5-10 minutes.'
                },
                {
                    heading: 'Step-by-Step Voting Guide',
                    list: [
                        '<strong>Step 1 — Find your booth:</strong> Check your polling booth location on the Voter Helpline App or the ECI website using your EPIC number.',
                        '<strong>Step 2 — Carry ID:</strong> Bring your EPIC (Voter ID card) or any of the 12 approved alternate ID documents.',
                        '<strong>Step 3 — Queue up:</strong> Arrive at the booth (opens at 7 AM). Separate queues may exist for men, women, and senior citizens/disabled.',
                        '<strong>Step 4 — Identity verification:</strong> The presiding officer checks your name on the electoral roll and verifies your identity.',
                        '<strong>Step 5 — Indelible ink:</strong> Ink is applied on your left index finger to prevent duplicate voting.',
                        '<strong>Step 6 — Cast your vote:</strong> Enter the voting compartment. Press the button on the <em>EVM (Electronic Voting Machine)</em> next to your chosen candidate\'s name and symbol.',
                        '<strong>Step 7 — VVPAT check:</strong> The <em>VVPAT</em> machine displays a slip for 7 seconds showing whom you voted for. Verify it!',
                        '<strong>Step 8 — Exit:</strong> Leave the booth. Your vote is now securely recorded.'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Tip:</strong> If you\'re unable to press the EVM button yourself due to disability, a companion can assist you. Ask the presiding officer for help.'
                },
                {
                    heading: 'Next Step',
                    content: 'Would you like to learn about the EVM and VVPAT machines, or check what documents you can carry as alternate ID?'
                }
            ]
        }
    },

    // ===== EVM & VVPAT =====
    evmVvpat: {
        keywords: ['evm', 'vvpat', 'electronic voting machine', 'voting machine', 'ballot unit', 'control unit', 'paper trail'],
        response: {
            title: '🖥️ Understanding EVM & VVPAT',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'The EVM (Electronic Voting Machine) is the device used to cast and record votes electronically. The VVPAT (Voter Verifiable Paper Audit Trail) is attached to the EVM and prints a paper slip so voters can verify their choice.'
                },
                {
                    heading: 'EVM — How It Works',
                    list: [
                        '<strong>Three units:</strong> Ballot Unit (voter presses button), Control Unit (records votes), and VVPAT (prints verification slip)',
                        '<strong>Standalone:</strong> EVMs are not connected to any network — no internet, no Wi-Fi. They run on batteries.',
                        '<strong>Capacity:</strong> Each EVM can record up to 2,000 votes and accommodate up to 16 candidates per ballot unit (up to 4 units can be linked = 64 candidates)',
                        '<strong>Security:</strong> EVMs use one-time programmable chips that cannot be reprogrammed or tampered with'
                    ]
                },
                {
                    heading: 'VVPAT — The Paper Trail',
                    list: [
                        'After you press a button on the EVM, the VVPAT displays a <em>printed slip</em> for 7 seconds',
                        'The slip shows the candidate\'s name, serial number, and party symbol',
                        'The slip then drops into a <em>sealed box</em> — you cannot take it',
                        'In case of a dispute, VVPAT slips can be counted to verify the EVM result'
                    ]
                },
                {
                    infoBox: true,
                    type: 'green',
                    content: '✅ <strong>Fact:</strong> As per Supreme Court orders, VVPAT slips of 5 randomly selected polling booths per constituency are physically matched with EVM results to ensure accuracy.'
                },
                {
                    heading: 'Next Step',
                    content: 'Want to know about security measures for EVMs, or how votes are counted on counting day?'
                }
            ]
        }
    },

    // ===== DOCUMENTS =====
    documents: {
        keywords: ['document', 'id proof', 'identity', 'what to carry', 'voter id card', 'aadhaar', 'alternate id', 'approved id', 'required documents'],
        response: {
            title: '📄 Documents for Voting',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'You primarily need your <em>EPIC (Voter ID card)</em> to vote. However, the ECI accepts 12 alternative photo identity documents if you don\'t have your Voter ID card.'
                },
                {
                    heading: 'Accepted Identity Documents',
                    list: [
                        'EPIC — Electors Photo Identity Card (Voter ID)',
                        'Aadhaar Card',
                        'MGNREGA Job Card',
                        'Passbook with photo (issued by Bank/Post Office)',
                        'Health Insurance Smart Card (under Ministry of Labour)',
                        'Driving License',
                        'PAN Card',
                        'Smart Card issued by RGI under NPR',
                        'Indian Passport',
                        'Pension document with photograph',
                        'Service Identity Card issued by Central/State Government, Public Limited Companies',
                        'Official identity card issued to MPs/MLAs/MLCs'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Important:</strong> Your name must be on the Electoral Roll of your constituency to vote. Having an ID alone is not enough — you must be registered!'
                },
                {
                    heading: 'Next Step',
                    content: 'Would you like to check your voter registration status or learn how to get your Voter ID card?'
                }
            ]
        }
    },

    // ===== ELECTION COMMISSION =====
    electionCommission: {
        keywords: ['election commission', 'eci', 'role of election commission', 'who conducts elections', 'chief election commissioner', 'election authority'],
        response: {
            title: '🏛️ The Election Commission of India',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'The Election Commission of India (ECI) is an autonomous constitutional body responsible for administering election processes across the country at all levels — from Lok Sabha to Panchayats.'
                },
                {
                    heading: 'Key Roles & Responsibilities',
                    list: [
                        '<strong>Conduct elections:</strong> Supervises and directs elections to Parliament, State Legislatures, and offices of President and Vice-President',
                        '<strong>Prepare electoral rolls:</strong> Maintains and updates the voter list across the country',
                        '<strong>Enforce Model Code of Conduct:</strong> Ensures a level playing field during election period',
                        '<strong>Schedule elections:</strong> Decides election dates and phases',
                        '<strong>Register political parties:</strong> Grants recognition and allots symbols to parties',
                        '<strong>Monitor spending:</strong> Tracks election expenditure of candidates and parties',
                        '<strong>Resolve disputes:</strong> Addresses complaints related to election violations'
                    ]
                },
                {
                    heading: 'Structure',
                    content: 'The ECI consists of the <strong>Chief Election Commissioner (CEC)</strong> and two <strong>Election Commissioners</strong>. They have a fixed tenure of 6 years or until age 65, whichever is earlier. The CEC can only be removed through a process similar to that of a Supreme Court judge.'
                },
                {
                    infoBox: true,
                    type: 'blue',
                    content: '📌 <strong>Article 324</strong> of the Indian Constitution vests the power of superintendence, direction, and control of elections in the Election Commission of India.'
                }
            ]
        }
    },

    // ===== NOTA =====
    nota: {
        keywords: ['nota', 'none of the above', 'reject all', 'dont want to vote anyone', 'no candidate'],
        response: {
            title: '🚫 NOTA — None of the Above',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'NOTA (None of the Above) is an option available on the EVM that allows you to officially register your vote without choosing any candidate. It was introduced in 2013 following a Supreme Court directive.'
                },
                {
                    heading: 'Key Facts About NOTA',
                    list: [
                        'NOTA is the <strong>last button</strong> on the EVM with a special ballot symbol (a cross mark ✖️)',
                        'It allows you to express dissatisfaction with <em>all</em> candidates while still participating in the election',
                        'NOTA votes are <strong>counted and reported</strong> in the official results',
                        'However, even if NOTA gets the most votes, the <strong>candidate with the highest votes still wins</strong> — NOTA does not invalidate the election',
                        'NOTA was introduced based on the <em>People\'s Union for Civil Liberties v. Union of India</em> Supreme Court judgment (2013)'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Why use NOTA?</strong> It\'s a way to exercise your right to vote while expressing that you find no candidate suitable. It ensures your visit to the booth is counted and your dissent is officially recorded.'
                }
            ]
        }
    },

    // ===== NRI VOTING =====
    nriVoting: {
        keywords: ['nri', 'overseas', 'abroad', 'foreign', 'nri vote', 'non resident', 'overseas voter', 'can nri vote'],
        response: {
            title: '✈️ NRI Voting in Indian Elections',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'Yes, NRIs (Non-Resident Indians) can vote in Indian elections! Since 2011, NRIs can register as overseas voters. However, they currently need to be physically present at the polling booth in their registered constituency to cast their vote.'
                },
                {
                    heading: 'How NRIs Can Vote',
                    list: [
                        '<strong>Step 1:</strong> Register as an overseas elector by filling <em>Form 6A</em> on the NVSP portal',
                        '<strong>Step 2:</strong> Provide your Indian passport details (valid or expired within last 3 years)',
                        '<strong>Step 3:</strong> Your name will be added to the electoral roll of the constituency matching your passport address',
                        '<strong>Step 4:</strong> On polling day, visit your assigned polling booth in India with your original Indian passport',
                        '<strong>Step 5:</strong> Vote using the EVM just like any domestic voter'
                    ]
                },
                {
                    infoBox: true,
                    type: 'blue',
                    content: '📌 <strong>Note:</strong> The ECI has been exploring e-postal ballot facility for overseas voters. Please verify the latest status on the official ECI website as policies may have been updated.'
                },
                {
                    heading: 'Next Step',
                    content: 'Need help filling Form 6A or checking your overseas voter registration status?'
                }
            ]
        }
    },

    // ===== VOTE COUNTING =====
    voteCounting: {
        keywords: ['counting', 'result', 'how votes counted', 'counting day', 'election result', 'who wins', 'vote count', 'counting process'],
        response: {
            title: '📊 Vote Counting Process',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'Vote counting happens at designated counting centers under strict supervision. EVMs from all booths are brought to counting centers, opened round by round, and votes are tallied electronically. Results are declared constituency by constituency.'
                },
                {
                    heading: 'Counting Day Process',
                    list: [
                        '<strong>Step 1 — Postal ballots first:</strong> Postal ballots (from service voters, senior citizens, etc.) are counted first starting at 8 AM',
                        '<strong>Step 2 — EVM counting begins:</strong> Each constituency\'s EVMs are opened in rounds of 14 tables simultaneously',
                        '<strong>Step 3 — VVPAT verification:</strong> Paper slips from 5 randomly selected booths are matched with EVM totals',
                        '<strong>Step 4 — Round-by-round tallying:</strong> Results are compiled after each round and shared with candidates\' counting agents',
                        '<strong>Step 5 — Declaration:</strong> Once all rounds are complete, the Returning Officer declares the result for that constituency',
                        '<strong>Step 6 — Certificate of Election:</strong> The winning candidate receives a certificate of election from the Returning Officer'
                    ]
                },
                {
                    heading: 'Who Can Be Present?',
                    content: 'Counting agents of each candidate, election officials, observers, and accredited media persons are allowed inside the counting center. The process is transparent and monitored by the ECI.'
                },
                {
                    infoBox: true,
                    type: 'green',
                    content: '✅ <strong>Fun fact:</strong> India\'s 2024 general election results for 543 Lok Sabha constituencies were largely declared within a single day, thanks to the efficiency of electronic counting!'
                }
            ]
        }
    },

    // ===== ELIGIBILITY =====
    eligibility: {
        keywords: ['eligibility', 'who can vote', 'eligible', 'age', 'minimum age', 'can i vote', 'qualify', 'criteria'],
        response: {
            title: '✅ Voter Eligibility Criteria',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'Any Indian citizen who is 18 years or older on the qualifying date and is a resident of the constituency is eligible to vote in Indian elections.'
                },
                {
                    heading: 'Eligibility Requirements',
                    list: [
                        '<strong>Citizenship:</strong> Must be a citizen of India',
                        '<strong>Age:</strong> Must be 18 years or older on the qualifying date (Jan 1, Apr 1, Jul 1, or Oct 1)',
                        '<strong>Residence:</strong> Must be an ordinary resident of the constituency where you wish to vote',
                        '<strong>Registration:</strong> Must be registered in the electoral roll (having an ID alone is not enough)',
                        '<strong>Sound mind:</strong> Must not be disqualified due to being of unsound mind as declared by a competent court'
                    ]
                },
                {
                    heading: 'Who Cannot Vote?',
                    list: [
                        'Non-citizens of India',
                        'Persons disqualified due to corrupt practices or election offenses',
                        'Persons declared of unsound mind by a competent court'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Remember:</strong> There is no educational, property, or income qualification required to vote in India. Voting is a fundamental right!'
                }
            ]
        }
    },

    // ===== POLITICAL BIAS DEFLECTION =====
    politicalBias: {
        keywords: ['who should i vote', 'best party', 'best candidate', 'which party', 'vote for whom', 'recommend party', 'support', 'bjp', 'congress', 'aap', 'favorite party'],
        response: {
            title: '⚖️ Maintaining Neutrality',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'I appreciate your trust, but I\'m designed to be completely <strong>neutral and non-partisan</strong>. I cannot recommend, support, or oppose any political party or candidate.'
                },
                {
                    heading: 'How You Can Make an Informed Decision',
                    list: [
                        '<strong>Review manifestos:</strong> Each party publishes its manifesto before elections — read them to understand their promises and policies',
                        '<strong>Check candidate backgrounds:</strong> The ECI website and platforms like <em>MyNeta.info</em> provide candidate affidavits with information on assets, criminal cases, and education',
                        '<strong>Attend local debates:</strong> Listen to candidates speak about local issues that matter to you',
                        '<strong>Focus on issues:</strong> Prioritize the issues that matter most to you (education, healthcare, infrastructure, etc.) and see which candidate addresses them',
                        '<strong>Verify claims:</strong> Use fact-checking resources to verify claims made during campaigns'
                    ]
                },
                {
                    infoBox: true,
                    type: 'blue',
                    content: '📌 <strong>Remember:</strong> Your vote is your choice and your right. No one — not even an AI — should tell you whom to vote for. Make an informed, independent decision!'
                }
            ]
        }
    },

    // ===== MODEL CODE OF CONDUCT =====
    modelCode: {
        keywords: ['model code', 'code of conduct', 'mcc', 'rules during election', 'campaign rules'],
        response: {
            title: '📜 Model Code of Conduct (MCC)',
            sections: [
                {
                    heading: 'Direct Answer',
                    content: 'The Model Code of Conduct is a set of guidelines issued by the ECI that governs the behavior of political parties, candidates, and the government during elections. It kicks in the moment elections are announced.'
                },
                {
                    heading: 'Key Rules Under MCC',
                    list: [
                        '<strong>No new policies:</strong> The ruling government cannot announce new schemes, projects, or financial grants',
                        '<strong>No public funds misuse:</strong> Government machinery and resources cannot be used for campaign purposes',
                        '<strong>No hate speech:</strong> Candidates cannot make appeals based on caste, religion, or communal sentiments',
                        '<strong>Campaign silence:</strong> Campaigning must stop <em>48 hours before polling</em>',
                        '<strong>No cash/gifts:</strong> Distribution of money, liquor, or gifts to influence voters is strictly prohibited',
                        '<strong>Permission required:</strong> Rallies, processions, and public meetings need prior permission from local authorities',
                        '<strong>Fair reporting:</strong> Media must provide balanced coverage without bias toward any candidate or party'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 <strong>Did you know?</strong> While the MCC is not legally enforceable by itself, violations can lead to action under IPC, RPA, and other laws. The ECI takes MCC violations very seriously.'
                }
            ]
        }
    },

    // ===== DEFAULT / GREETING =====
    greeting: {
        keywords: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'help', 'start'],
        response: {
            title: '🙏 Namaste! Welcome!',
            sections: [
                {
                    heading: '',
                    content: 'I\'m your AI Election Guide for India. I\'m here to help you understand the election process in a simple, step-by-step manner.'
                },
                {
                    heading: 'I Can Help You With',
                    list: [
                        '📝 <strong>Voter Registration</strong> — How to register and get your Voter ID',
                        '📅 <strong>Election Timeline</strong> — Phases from announcement to results',
                        '🗳️ <strong>Voting Process</strong> — What happens at the polling booth',
                        '📄 <strong>Documents</strong> — What ID to carry on voting day',
                        '🖥️ <strong>EVM & VVPAT</strong> — How voting machines work',
                        '🏛️ <strong>Election Commission</strong> — Role and responsibilities',
                        '✈️ <strong>NRI Voting</strong> — How overseas Indians can vote',
                        '🚫 <strong>NOTA</strong> — The \'None of the Above\' option'
                    ]
                },
                {
                    heading: '',
                    content: 'What would you like to know about? Just ask in your own words! 😊'
                }
            ]
        }
    },

    // ===== FALLBACK =====
    fallback: {
        response: {
            title: '🤔 Let Me Help You Better',
            sections: [
                {
                    heading: '',
                    content: 'I wasn\'t quite sure what you\'re asking about. I specialize in the Indian election process. Here are some things I can help with:'
                },
                {
                    heading: 'Topics I Cover',
                    list: [
                        'Voter registration process',
                        'Election timeline and phases',
                        'Voting process at polling booths',
                        'EVM and VVPAT machines',
                        'Required documents for voting',
                        'Election Commission of India',
                        'NOTA (None of the Above)',
                        'NRI/Overseas voting',
                        'Model Code of Conduct',
                        'Voter eligibility criteria'
                    ]
                },
                {
                    infoBox: true,
                    type: 'default',
                    content: '💡 Try asking something like: "How do I register to vote?" or "What happens on polling day?"'
                },
                {
                    heading: '',
                    content: 'Please verify any specific or uncertain information from the official Election Commission of India website at <em>eci.gov.in</em>.'
                }
            ]
        }
    }
};
