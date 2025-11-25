// Anglo-Chinese School (Primary) Primary 6 English Language Preliminary Examination 2024

export const exam = {
  id: '2024-p6-english-prelim-acsp',
  title: 'Anglo-Chinese School (Primary) Primary 6 English Language Preliminary Examination 2024',
  booklet: 'Booklet A & B',
  sections: [
    {
      title: 'Grammar (MCQ)',
      instructions: '',
      questions: [
        {
          id: 1,
          type: 'mcq',
          question: 'Mary rarely stays up late, ___?',
          options: ['is it', "isn't it", 'does she', "doesn't she"],
          answer: 'does she', topic: 'Grammar',
        },
        {
          id: 2,
          type: 'mcq',
          question: 'Neither Jack nor ___ completed the assignment as we were tired.',
          options: ['I', 'us', 'me', 'myself'],
          answer: 'I', topic: 'Grammar',
        },
        {
          id: 3,
          type: 'mcq',
          question: 'The lady to ___ you were speaking earlier is my neighbour.',
          options: ['who', 'which', 'whom', 'whose'],
          answer: 'whom', topic: 'Grammar',
        },
        {
          id: 4,
          type: 'mcq',
          question:
            '___ the rising temperatures, many people continue to participate in outdoor activities.',
          options: ['Owing to', 'In spite of', 'Because of', 'Even though'],
          answer: 'In spite of', topic: 'Grammar',
        },
        {
          id: 5,
          type: 'mcq',
          question:
            'Had it not been for my brother, I ___ to the concert as I do not like crowds.',
          options: ['will not go', 'would not go', 'will not be going', 'would not have gone'],
          answer: 'would not have gone', topic: 'Grammar',
        },
        {
          id: 6,
          type: 'mcq',
          question:
            'My sister, as well as my cousins, ___ a party to celebrate my upcoming birthday.',
          options: ['organise', 'is organising', 'are organising', 'have organised'],
          answer: 'is organising', topic: 'Grammar',
        },
        {
          id: 7,
          type: 'mcq',
          question:
            'Although he was poor, the generous man gave the ___ that he had to charity.',
          options: ['little', 'none', 'some', 'much'],
          answer: 'little', topic: 'Grammar',
        },
        {
          id: 8,
          type: 'mcq',
          question:
            'On seeing the discipline master approaching, the class fell silent and ___ dared to utter a word.',
          options: ['nobody', 'anybody', 'everybody', 'somebody'],
          answer: 'nobody', topic: 'Grammar',
        },
        {
          id: 9,
          type: 'mcq',
          question:
            'My brother suggested that I ___ to bed early instead of staying up to study for my examination the next day.',
          options: ['go', 'went', 'am going', 'had gone'],
          answer: 'go', topic: 'Grammar',
        },
        {
          id: 10,
          type: 'mcq',
          question:
            "As Jane's pencil case was similar ___ Mary's, she mistook Mary's for hers.",
          options: ['in', 'to', 'with', 'from'],
          answer: 'to', topic: 'Grammar',
        },
      ],
    },
    {
      title: 'Vocabulary (MCQ)',
      questions: [
        {
          id: 11,
          type: 'mcq',
          question:
            '"How do I solve this puzzle?" Tom ___ as he tried to put the pieces together.',
          options: ['figured', 'debated', 'pondered', 'speculated'],
          answer: 'pondered', topic: 'Vocabulary',
        },
        {
          id: 12,
          type: 'mcq',
          question:
            'We need to be ___ in our work to avoid making careless mistakes.',
          options: ['prompt', 'decisive', 'convincing', 'meticulous'],
          answer: 'meticulous', topic: 'Vocabulary',
        },
        {
          id: 13,
          type: 'mcq',
          question:
            'The arrogant boy refused to ___ his mistake and apologise for it.',
          options: ['affirm', 'announce', 'acknowledge', 'accommodate'],
          answer: 'acknowledge', topic: 'Vocabulary',
        },
        {
          id: 14,
          type: 'mcq',
          question:
            'Tom and Jerry are always quarrelling because they cannot ___.',
          options: ['break a leg', 'hit the sack', 'see eye to eye', 'sit on the fence'],
          answer: 'see eye to eye', topic: 'Vocabulary',
        },
        {
          id: 15,
          type: 'mcq',
          question:
            'Realising that there was no escape, the robber did not ___ a fight when the policeman handcuffed him.',
          options: ['put on', 'put up', 'put off', 'put down'],
          answer: 'put up', topic: 'Vocabulary',
        },
      ],
    },
    {
      title: 'Vocabulary in Context (MCQ)',
      passage:
        'Climate change refers to a change in the typical weather of a region over a long period of time. Scientists have [observed] that the Earth is getting warmer, and the global temperature is rising. This [occurrence] is called global warming. As human activities such as the destruction of forests and burning of fossil fuels lead to global warming, we all should play an active role to [ease] this problem. Do you know you can make a difference by making simple choices daily? You can conserve energy by switching off lights, fans and your computer when they are not in use. You can also save energy by recycling properly. To do so, you need to know what items can be recycled, and ensure that they are clean and dry before [depositing] them into recycling bins. [Collectively], we can help slow down climate change and save the Earth. Let\'s do our part and make a difference!',
      questions: [
        { id: 16, type: 'mcq', question: 'observed', options: ['defined', 'noticed', 'accepted', 'overlooked'], answer: 'noticed', topic: 'Vocabulary' },
        { id: 17, type: 'mcq', question: 'occurrence', options: ['action', 'situation', 'outcome', 'response'], answer: 'situation', topic: 'Vocabulary' },
        { id: 18, type: 'mcq', question: 'ease', options: ['absorb', 'assume', 'alleviate', 'aggravate'], answer: 'alleviate', topic: 'Vocabulary' },
        { id: 19, type: 'mcq', question: 'depositing', options: ['sorting', 'settling', 'placing', 'directing'], answer: 'placing', topic: 'Vocabulary' },
        { id: 20, type: 'mcq', question: 'Collectively', options: ['Jointly', 'Totally', 'Commonly', 'Individually'], answer: 'Jointly', topic: 'Vocabulary' },
      ],
    },
    {
      title: 'Visual Text Comprehension',
      instructions: 'Study this flyer carefully and then answer the below question.',
      isVisual: true,
      passage:
        'Welcome to The Explorers Club!\nThe Explorers Club is an outdoor activities club that promises to provide children aged between four and twelve with hours of fun as they discover the benefits of outdoor play. Located on top of a hill, Singa Service Club is home to The Explorers Club where we run our programmes both within the club and at various outdoor spaces around Singapore. We offer a series of outdoor skills learning programmes, holiday camps and even host birthday parties at our venue throughout the year.\nWhy join us?\nWe aim to equip children with essential survival skills through play. Under the supervision of certified instructors, children as young as five years old will learn how to pitch a tent, identify edible plants, collect clean water and read maps. These skills will help children to become independent individuals. We believe that being in nature can foster a sense of responsibility and care for the environment. Electronic devices can be great educational tools. However, learning and playing outdoors can give children a chance to grow their curiosity. They will also learn to have empathy for nature and wildlife as they admire the natural beauty around them. We focus on exposing young children to situations that will build their character, strength, resilience and forge friendships. Outdoor activities are not always smooth sailing and children will need to persevere. Though they may not always succeed, these activities encourage children to show teamwork and communicate respectfully.\n\nStep Out and Be Active!\nDates: 2 & 3 September 2024\nVenue: Singa Service Club - Level 2 Activity Hub\n\nAll sessions are held in the afternoon between 2 p.m. and 6 p.m.\nExplorers Club members enjoy $5 off the stated activity fee.\n\n2 September 2024\n2.00 p.m. - 3.00 p.m. Camping Skills Workshop (Grove Hall) - pitch tents, tie knots and set up camp. Walk-in registration accepted.\n3.00 p.m. - 4.00 p.m. Rock Climbing Clinic (Grove Hall) - limited to 12 climbers. Register online at www.explorersclub.sg/stepout before 1 September.\n4.00 p.m. - 5.30 p.m. Bukit Limah Walk (Nature Foyer) - guided hike through the hilltop trails.\n\n3 September 2024\n2.00 p.m. - 3.00 p.m. Meet the Botanist: Plants & Flowers (Wander Room) - horticulturist Dr Asha shares tips on caring for blooms.\n3.00 p.m. - 3.30 p.m. Trail Navigation Challenge (Expert Room) - map reading games to sharpen orientation skills.\n3.30 p.m. - 4.30 p.m. Rock Climbing Clinic (Grove Hall) - repeat session for new climbers.\n4.30 p.m. - 5.30 p.m. Sea Sports Safety Talk (Expert Room) - learn how to stay safe during kayaking and sailing adventures.\n\nAll activity fees already cover equipment and materials unless stated otherwise. Limited slots are available, so reserve yours quickly!',
      questions: [
        {
          id: 21,
          type: 'mcq',
          question: 'Why is an exclamation mark used in the heading, "Welcome to The Explorers Club!"?',
          options: [
            'to excite readers to join the club',
            'to guide readers to be explorers',
            'to instruct readers to love the outdoors',
            'to encourage readers to meet explorers',
          ],
          answer: 'to excite readers to join the club', topic: 'Reading & Viewing',
        },
        {
          id: 22,
          type: 'mcq',
          question: 'What is the main aim of The Explorers Club?',
          options: [
            'to host children\'s birthday parties',
            'to encourage learning beyond indoor settings',
            'to entertain children during the school holidays',
            'to travel to various outdoor spaces around Singapore',
          ],
          answer: 'to encourage learning beyond indoor settings', topic: 'Reading & Viewing',
        },
        {
          id: 23,
          type: 'mcq',
          question:
            'According to the poster, which of the following is true of outdoor activities club? Participants will',
          options: [
            'need to work individually',
            'learn how to grow edible plants',
            'have a chance to make new friends',
            'learn survival skills using electronic devices',
          ],
          answer: 'have a chance to make new friends', topic: 'Reading & Viewing',
        },
        {
          id: 24,
          type: 'mcq',
          question: 'Which of the following is true of the activities organised at Step Out and Be Active?',
          options: [
            'All participants will receive a free cap.',
            'The activities are held in the afternoon.',
            'Registration is needed for all the activities.',
            'Participants must pay for all materials and equipment used.',
          ],
          answer: 'The activities are held in the afternoon.', topic: 'Reading & Viewing',
        },
        {
          id: 25,
          type: 'mcq',
          question:
            'Alex is thinking about joining The Explorers Club. According to the poster, he should join the club if he wants to',
          options: [
            'pitch a tent on top of a hill',
            'be a member of Singa Service Club',
            'enjoy all facilities at Singa Service Club',
            'pay less to be part of Step Out and Be Active',
          ],
          answer: 'pay less to be part of Step Out and Be Active', topic: 'Reading & Viewing',
        },
        {
          id: 26,
          type: 'mcq',
          question: 'Roger would like to learn more about plants and flowers from an expert. Which venue should he report at?',
          options: ['Grove Hall', 'Nature Foyer', 'Expert Room', 'Wander Room'],
          answer: 'Wander Room', topic: 'Reading & Viewing',
        },
        {
          id: 27,
          type: 'mcq',
          question: 'Devi wants to join the Rock Climbing Clinic on 2 September. She must',
          options: [
            'be available for an hour',
            'bring rock climbing shoes',
            'register for the activity online',
            'have basic rock-climbing skills',
          ],
          answer: 'register for the activity online', topic: 'Reading & Viewing',
        },
        {
          id: 28,
          type: 'mcq',
          question:
            'Pamela wants to take part in Step Out and Be Active on 3 September but she is only free from 3.30 p.m. onwards. Which two activities can she choose to participate in?',
          options: [
            'Rock Climbing Clinic and Bukit Limah Walk',
            'Camping Skills Workshop and Bukit Limah Walk',
            'Rock Climbing Clinic and Sea Sports Safety Talk',
            'Camping Skills Workshop and Sea Sports Safety Talk',
          ],
          answer: 'Rock Climbing Clinic and Sea Sports Safety Talk', topic: 'Reading & Viewing',
        },
      ],
    },
    {
      title: 'Cloze Passage',
      instructions:
        'From the list of words given, choose the most suitable word for each blank. Write its letter (A to Q) in the blank. The letters (I) and (O) have been omitted to avoid confusion during marking. EACH WORD CAN BE USED ONLY ONCE.',
      wordBank: ['(A) are', '(B) as', '(C) for', '(D) have', '(E) had', '(F) off', '(G) over', '(H) should', '(J) to', '(K) too', '(L) upon', '(M) were', '(N) when', '(P) where', '(Q) would'],
      passage:
        'Smooth-coated otters are named after their velvety smooth coats. They are one of the two otter species found in Singapore and are the largest otters in Southeast Asia. These mammals are often spotted in mangroves and coastal areas (29)___ they search for clams, fish and other small creatures. They (30)___ webbed paws that are highly adapted (31)___ swimming. They are playful creatures and like to swim in packs of four (32)___ twelve while chasing after fish. Otters (33)___ most regularly seen at the wetlands in the past. (34)___ the years, there have been frequent sightings reported all over the island in places such as the Botanic Gardens and even the financial district, Marina Bay. It is natural to be curious when you chance (35)___ otters. However, you should not touch or chase the otters. Going too close to the otters may frighten them. Avoid talking loudly or using flash photography, (36)___ noise and light may scare and provoke them. If you take your dog for a walk, you (37)___ keep it on a leash. Your dog may chase the otters and frighten them. (38)___ this happens, otters may attack out of fear. Keeping a respectful distance will ensure otters and humans can live together harmoniously in the same environment.',
      questions: [
        { id: 29, type: 'dropdown', answer: 'where', topic: 'Grammar' },
        { id: 30, type: 'dropdown', answer: 'have', topic: 'Grammar' },
        { id: 31, type: 'dropdown', answer: 'for', topic: 'Grammar' },
        { id: 32, type: 'dropdown', answer: 'to', topic: 'Grammar' },
        { id: 33, type: 'dropdown', answer: 'were', topic: 'Grammar' },
        { id: 34, type: 'dropdown', answer: 'over', topic: 'Grammar' },
        { id: 35, type: 'dropdown', answer: 'upon', topic: 'Grammar' },
        { id: 36, type: 'dropdown', answer: 'as', topic: 'Grammar' },
        { id: 37, type: 'dropdown', answer: 'should', topic: 'Grammar' },
        { id: 38, type: 'dropdown', answer: 'when', topic: 'Grammar' },
      ],
    },
    {
      title: 'Spelling & Grammar Correction',
      instructions: 'Each of the highlighted words shown in brackets contains either a spelling or grammatical error. Write the correct word in each of the boxes.',
      passage:
        'The smell of the sea always reminds me of my fishing trips with my father as a child. I would ride pillion on his motorcycle to the usual fishing spot once a week. There, I would [lay] on a picnic mat and read a book. [Okasionally], I would be tasked to search for live bait. I remember digging the soil with a rusty red spade and [pull] out earthworms with my bare fingers. Whenever I discovered one, I used to [skweel] in delight and my father would nod at me approvingly. As I got older, my father [allows] me to attach earthworms onto fishing hooks. I learnt the hard way that fishing hooks could catch on to my clothes, hair and even skin if I was not careful. Removing them [are] painful and difficult. My father also taught me how to use dried radish tied to a string to lure little crabs from their hiding holes. Catching these crabs [requaiered] me to stay very still. The minute I felt the [slight] tug, I had to quickly position a pail below the crab to let it drop into the pail. Once, I took my catch home and [leave] the pail of crabs in the kitchen overnight uncovered. During Science lesson the next day, I felt something pinch my leg and I let out an [ear-peersing] scream. [Comoshen] ensued in the class. The crab had [apairently] crawled into my school bag. As expected, I spent recess that day explaining to my teacher what had happened.',
      questions: [
        { id: 39, type: 'text_input', original: 'lay', answer: 'lie', topic: 'Grammar' },
        { id: 40, type: 'text_input', original: 'Okasionally', answer: 'Occasionally', topic: 'Grammar' },
        { id: 41, type: 'text_input', original: 'pull', answer: 'pulling', topic: 'Grammar' },
        { id: 42, type: 'text_input', original: 'skweel', answer: 'squeal', topic: 'Grammar' },
        { id: 43, type: 'text_input', original: 'allows', answer: 'allowed', topic: 'Grammar' },
        { id: 44, type: 'text_input', original: 'are', answer: 'was', topic: 'Grammar' },
        { id: 45, type: 'text_input', original: 'requaiered', answer: 'required', topic: 'Grammar' },
        { id: 46, type: 'text_input', original: 'slight', answer: 'slightest', topic: 'Grammar' },
        { id: 47, type: 'text_input', original: 'leave', answer: 'left', topic: 'Grammar' },
        { id: 48, type: 'text_input', original: 'ear-peersing', answer: 'ear-piercing', topic: 'Grammar' },
        { id: 49, type: 'text_input', original: 'Comoshen', answer: 'commotion', topic: 'Grammar' },
        { id: 50, type: 'text_input', original: 'apairently', answer: 'apparently', topic: 'Grammar' },
      ],
    },
    {
      title: 'Fill in the Blanks',
      instructions: 'Fill in each blank with a suitable word.',
      passage:
        'Imagine a world where everyone stands up for what is right. That world begins with us. (51)___ and every one of us can make the world a better place by being an upstander. Being an upstander means having compassion towards our peers who have (52)___ bullied. When we put (53)___ in someone else\'s shoes, we would then realise that we would not want to be teased or excluded. Hence, all of us should look out for one another and (54)___ no one gets hurt. Like a superhero without a cape, upstanders speak (55)___ when they recognise that something is not right. (56)___ from noticing wrongdoings, upstanders take action to make things right. On the other hand, bystanders usually do not take action due to their fear of being the next victim of bullying. They also may not know (57)___ to manage the situation. Hence, bystanders merely observe events and situations (58)___ interfering while upstanders will report wrongdoings and offer support to victims of bullying. We should therefore always choose to help the victims. It (59)___ courage to be an upstander. I remember a time when I saw a classmate crying after being teased during recess. (60)___ of just watching, I walked over to sit with him and comforted him. Later, I (61)___ my teacher about the incident. That courageous (62)___ not only made a difference to my classmate but it also inspired others to do the same. We create a ripple (63)___ when we are upstanders. Know that you are not alone as when others see you being an upstander, they will (64)___ suit. By supporting each other, we (65)___ create a caring community. Together, we can make a significant difference.',
      questions: [
        { id: 51, type: 'text_input', answer: 'Each', topic: 'Vocabulary' },
        { id: 52, type: 'text_input', answer: 'been', topic: 'Vocabulary' },
        { id: 53, type: 'text_input', answer: 'ourselves', topic: 'Vocabulary' },
        { id: 54, type: 'text_input', answer: 'ensure', topic: 'Vocabulary' },
        { id: 55, type: 'text_input', answer: 'up', topic: 'Vocabulary' },
        { id: 56, type: 'text_input', answer: 'Apart', topic: 'Vocabulary' },
        { id: 57, type: 'text_input', answer: 'how', topic: 'Vocabulary' },
        { id: 58, type: 'text_input', answer: 'without', topic: 'Vocabulary' },
        { id: 59, type: 'text_input', answer: 'requires', topic: 'Vocabulary' },
        { id: 60, type: 'text_input', answer: 'Instead', topic: 'Vocabulary' },
        { id: 61, type: 'text_input', answer: 'told', topic: 'Vocabulary' },
        { id: 62, type: 'text_input', answer: 'act', topic: 'Vocabulary' },
        { id: 63, type: 'text_input', answer: 'effect', topic: 'Vocabulary' },
        { id: 64, type: 'text_input', answer: 'follow', topic: 'Vocabulary' },
        { id: 65, type: 'text_input', answer: 'can', topic: 'Vocabulary' },
      ],
    },
    {
      title: 'Sentence Synthesis',
      instructions:
        'Rewrite the given sentence(s) using the word(s) provided. Your answer must be in one sentence. The meaning of your sentence must be the same as the meaning of the given sentence(s).',
      questions: [
        {
          id: 66,
          type: 'textarea',
          question: 'Bob likes to eat pizza. He likes to eat sushi more.',
          prompt: 'Bob prefers',
          answer: 'Bob prefers eating sushi to pizza.', topic: 'Writing & Representing',
        },
        {
          id: 67,
          type: 'textarea',
          question: 'John saw that I was disappointed. He bought me an ice cream to cheer me up.',
          prompt: 'Seeing my',
          answer: 'Seeing my disappointment, John bought me an ice cream to cheer me up.', topic: 'Writing & Representing',
        },
        {
          id: 68,
          type: 'textarea',
          question: '"Will you attend the workshop next week?" Ben asked Fiona.',
          prompt: 'Ben asked Fiona',
          answer: 'Ben asked Fiona if she would attend the workshop the following week.', topic: 'Writing & Representing',
        },
        {
          id: 69,
          type: 'textarea',
          question: 'The pencil case belongs to Helen. It has a keychain attached to it.',
          prompt: 'which',
          answer: 'The pencil case which has a keychain attached to it belongs to Helen.', topic: 'Writing & Representing',
        },
        {
          id: 70,
          type: 'textarea',
          question: 'Amy had not baked cookies before. She burnt all of them.',
          prompt: 'Not having',
          answer: 'Not having baked cookies before, Amy burnt all of them.', topic: 'Writing & Representing',
        },
      ],
    },
    {
      title: 'Reading Comprehension',
      instructions: 'Read the passage below and answer the questions that follow.',
      passage:
        'Twelve-year-old Emily often ignored advice from her parents and insisted she was always right. She usually bossed her siblings around and was mean to her peers. As a result, her personality drove all her peers away because no one could tolerate her behaviour. Emily\'s arrogance often landed her in trouble. Whenever her father, an experienced Mathematics teacher, tried to help her with her Mathematics homework, she would reply curtly that she did not need his help. Her father would sigh in resignation. Emily would then spend more time to complete her homework until the wee hours and often overslept the next morning. Although she usually managed to submit it, she would be punished for reporting late for school. At times, she would be reprimanded for dozing off in class. Emily\'s arrogance also caused her pain. At a particularly intense training session, her Track and Field coach offered her guidance, pointing out ways to improve her running technique. Unfortunately, Emily refused to heed his advice. Not long after, she felt a sharp pain in her knee. "I will prove Coach wrong! I am sure my way is the right way!" Emily thought. However, as she continued to run, the pain intensified, shooting through her leg with every step she took. Even when her teammate, Sarah, told her not to overexert herself, she ignored her advice and snapped at her, "Mind your own business." At that, the coach shook his head disapprovingly. He could not understand why Emily insisted on her ways. Later that night, the pain kept her awake. As she lay in bed, she found it impossible to find a comfortable position. Emily was in agony every time she moved. It was then that she realised the consequences of her arrogance. If only she had listened to her coach. At that moment, it dawned on her that she had no friends to seek comfort from. Emily sobbed uncontrollably as this thought raced through her mind. Just when she needed someone to talk to, Emily\'s mother appeared at her bedroom door, looking concerned. "Are you okay, Emily? Your coach called. I heard about what happened today. I know you\'re strong-willed and independent. But the greatest strength comes from accepting the advice of others. Remember, doing this doesn\'t mean you are weak," Emily\'s mother said. With tears streaming down her cheeks, Emily lowered her eyes. After she had dried her tears, she mumbled softly, "You are right, Mum. My arrogance is the reason I am experiencing so much pain and it has soured my relationship with others. I will change. I promise I will." Recognising the need to change for the better, Emily decided to apologise to the friends she had hurt in the past and thank her parents and coach for being patient and never giving up on her. As it was important to mend her relationships, Emily took the time to make personalised cards for them. After her numerous visits to the hospital to treat her injury, the doctor finally told Emily she could start training again. When she resumed training, her teammates and coach welcomed her back with open arms. In the end, her knee injury became more than just a physical injury; it was a powerful lesson on the importance of humility. With her mother\'s words etched deeply in her heart, Emily made a promise to herself to always remain humble and be willing to learn from others. She was determined to become the best version of herself and everyone noticed a positive change in her.',
      questions: [
        {
          id: 71,
          type: 'open_ended',
          question: 'From the first paragraph, what did Emily do to drive all her peers away?',
          answer:
            'Emily bossed her siblings around and was mean to her peers, and her peers could not tolerate her behaviour.',
        },
        {
          id: 72,
          type: 'open_ended',
          question: 'What were the two consequences Emily had to face at school as a result of oversleeping?',
          answer:
            'Emily would be punished for reporting late for school and would be reprimanded for dozing off in class.',
        },
        {
          id: 73,
          type: 'open_ended',
          question:
            "From lines 4 to 15, pick out two separate phrases to show the characters' feelings and explain why they felt that way.",
          answer:
            'a) sigh in resignation. b) Emily\'s father felt helpless because Emily replied curtly that she did not need his help with her Mathematics homework. c) shook his head disapprovingly. d) The coach felt upset because Emily ignored her teammate\'s advice and snapped at her.',
        },
        {
          id: 74,
          type: 'open_ended',
          question: 'What did Emily do to "prove Coach wrong" (line 11)?',
          answer: 'Emily continued to run her own way despite the sharp pain in her knee.', topic: 'Reading & Viewing',
        },
        {
          id: 75,
          type: 'open_ended',
          question:
            'Look at the table below. What do the words in the left column refer to in the passage? a) his (line 11) b) this thought (line 19)',
          answer: 'a) The Track and Field coach. b) The thought that she had no friends to seek comfort from.', topic: 'Reading & Viewing',
        },
        {
          id: 76,
          type: 'open_ended',
          question: "What did Emily's mother say to her in the bedroom about her strengths and weaknesses?",
          answer:
            'a) About Emily\'s strengths: She was strong-willed and independent. b) About Emily\'s weakness: She did not accept the advice of others.',
        },
        {
          id: 77,
          type: 'open_ended',
          question:
            'Based on lines 21-33, state whether each statement is true or false, then give one reason why you think so. a) Emily\'s mother found out what had happened from Sarah. b) Emily was sincere about mending her relationships. c) Emily\'s injury was not serious.',
          answer:
            'a) False. Her mother found out from the coach who called. b) True. She took the time to make personalised cards for them. c) False. She needed numerous visits to the hospital to treat her injury.',
        },
        {
          id: 78,
          type: 'open_ended',
          question: '"I will change. I promise I will." (line 27). What did Emily realise that made her say so?',
          answer:
            'Emily realised her arrogance was the reason she was experiencing a lot of pain and it had soured her relationship with others.',
        },
        {
          id: 79,
          type: 'open_ended',
          question:
            'Which two of the following words best describe Emily in lines 28-30? (remorseful, confident, mean, patient, stubborn, grateful)',
          answer: 'remorseful, grateful', topic: 'Reading & Viewing',
        },
        {
          id: 80,
          type: 'open_ended',
          question: "How would a positive change in Emily's behaviour improve her school and personal life? State one example each.",
          answer: 'School life: She would have more friends. Personal life: She would complete her homework faster and not report late for school.', topic: 'Reading & Viewing',
        },
      ],
    },
  ],
};

export default exam;
