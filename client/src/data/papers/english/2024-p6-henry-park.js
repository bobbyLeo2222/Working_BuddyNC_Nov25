// Henry Park Primary School Primary 6 English Language Preliminary Examination 2024

export const exam = {
  id: '2024-p6-english-prelim-henry-park',
  title: 'Henry Park Primary School Primary 6 English Language Preliminary Examination 2024',
  booklet: 'Booklet A & B',
  sections: [
    {
      title: 'Grammar (MCQ)',
      instructions: '',
      questions: [
        { id: 1, type: 'mcq', question: 'All the laundry ___ picked up by the delivery man this morning.', options: ['is', 'are', 'was', 'were'], answer: 'was', topic: 'Grammar' },
        {
          id: 2,
          type: 'mcq',
          question: `"Ahmad's cleaned up his room, ___?" asked Mdm Rohana.`,
          options: ["isn't he", "didn't he", "hasn't he", "doesn't he"],
          answer: "hasn't he",
          topic: 'Grammar',
        },
        { id: 3, type: 'mcq', question: '___ the students need any help with the project, they can approach their teachers.', options: ['Will', 'Shall', 'Would', 'Should'], answer: 'Should', topic: 'Grammar' },
        { id: 4, type: 'mcq', question: 'The man ___ was in the news for helping the elderly is my neighbour.', options: ['who', 'which', 'whom', 'whose'], answer: 'who', topic: 'Grammar' },
        { id: 5, type: 'mcq', question: 'Given that Julie knew of the situation at the last minute, there was ___ that she could do.', options: ['few', 'little', 'many', 'much'], answer: 'little', topic: 'Grammar' },
        { id: 6, type: 'mcq', question: '___ being exhausted from the long hours of training, the dancers persevered through the final rehearsal and gave their best.', options: ['Until', 'Despite', 'Owing to', 'As a result of'], answer: 'Despite', topic: 'Grammar' },
        { id: 7, type: 'mcq', question: 'George confided ___ Sally, his best friend, about his problems at work.', options: ['in', 'of', 'with', 'through'], answer: 'in', topic: 'Grammar' },
        {
          id: 8,
          type: 'mcq',
          question: `"I ___ the best time of my life right now!" squealed little Timmy in excitement as he rode around in his new mini scooter.`,
          options: ['am having', 'was having', 'will be having', 'have been having'],
          answer: 'am having',
          topic: 'Grammar',
        },
        { id: 9, type: 'mcq', question: 'Mrs Chen saw the colourful bird ___ swiftly over the sunlit rooftop.', options: ['fly', 'flies', 'flew', 'flown'], answer: 'fly', topic: 'Grammar' },
        { id: 10, type: 'mcq', question: 'Wei Ming, ___ counselled by the teacher, decided to change for the better.', options: ['is', 'was', 'had been', 'having been'], answer: 'having been', topic: 'Grammar' },
      ],
    },
    {
      title: 'Vocabulary (MCQ)',
      questions: [
        { id: 11, type: 'mcq', question: 'The weather service has issued a severe thunderstorm warning and cautioned that visibility on the roads is going to be ___.', options: ['blur', 'poor', 'hazy', 'vague'], answer: 'poor', topic: 'Vocabulary' },
        { id: 12, type: 'mcq', question: 'Siti and Mary were best friends but they ___ last week because of a huge misunderstanding.', options: ['fell in', 'fell out', 'fell over', 'fell apart'], answer: 'fell out', topic: 'Vocabulary' },
        { id: 13, type: 'mcq', question: 'Geraldine is well-known to be someone who is ___ on her feet to come up with solutions within a short time.', options: ['swift', 'hasty', 'quick', 'instant'], answer: 'quick', topic: 'Vocabulary' },
        { id: 14, type: 'mcq', question: 'The smell from the rubbish bin was so ___ that Alan vomited after he walked past it.', options: ['acute', 'severe', 'intensive', 'overwhelming'], answer: 'overwhelming', topic: 'Vocabulary' },
        { id: 15, type: 'mcq', question: 'The pirates entered Singapore illegally and will be ___ to their home country next week.', options: ['deported', 'exported', 'released', 'dismissed'], answer: 'deported', topic: 'Vocabulary' },
      ],
    },
    {
      title: 'Vocabulary in Context (MCQ)',
      passage:
        "According to the World Economic Forum, only 14% of plastic packaging is collected for recycling. Plastics often become [soiled] with food waste. As a result, the majority of plastics end up either incinerated or [disposed of] in landfills.\n\nMany companies are turning to [innovative] solutions such as reusable packaging. A famous coffee chain is actively working to reduce its [reliance on] disposable cups. The company has announced plans to [phase out] single-use cups by 2025 and introduce a 'Borrow-a-Cup' programme.\n\nThis shift towards reusable packaging represents an important step in reducing waste. All of us can help to alleviate the climate crisis.",
      questions: [
        { id: 16, type: 'mcq', question: 'soiled', options: ['dented', 'stained', 'tarnished', 'contaminated'], answer: 'contaminated', topic: 'Vocabulary' },
        { id: 17, type: 'mcq', question: 'disposed of', options: ['discarded', 'dissected', 'distributed', 'dismantled'], answer: 'discarded', topic: 'Vocabulary' },
        { id: 18, type: 'mcq', question: 'innovative', options: ['creative', 'practical', 'corrective', 'differentiated'], answer: 'creative', topic: 'Vocabulary' },
        { id: 19, type: 'mcq', question: 'reliance on', options: ['trust', 'certainty', 'assurance', 'dependence'], answer: 'dependence', topic: 'Vocabulary' },
        { id: 20, type: 'mcq', question: 'phase out', options: ['present suddenly', 'remove suddenly', 'introduce gradually', 'eliminate gradually'], answer: 'eliminate gradually', topic: 'Vocabulary' },
      ],
    },
    {
      title: 'Visual Text Comprehension',
      instructions: 'Study this flyer carefully and then answer the below question.',
      isVisual: true,
      passage: `Cooking Guru Festival 2024
20 & 21 September 2024, Singapore Exhibition Centre, Hall 9B
The annual Cooking Guru Festival is back! This year, Cooking Guru Company has planned two delightful days of fun and food leading up to the much-anticipated Cooking Guru Competition. Get ready for a feast for your eyes, ears and stomachs with the spread of activities planned for you!

Prepare Pan-tastic Pancakes
Get creative with celebrity chef Rosemary Lyn's pancake recipe by adding chocolate chips, fruits or even bacon and cheese! All you need are eggs, milk, flour and baking powder to make the perfect fluffy pancakes. This is the chance to learn the perfect pancake flip under her guidance.

Make Eggs-traordinary Eggs
Sign up for this workshop to learn different healthy ways of cooking eggs! Make perfect poached eggs with Chef Taylor Fennel, who is also known for his world-famous creamy scrambled eggs. Who knows? He might even share his scrambled egg secrets with you!

Kitchen Tales, Tips & Tricks Talk
Join Singaporean chef John Chiang as he shares his experiences working as a head chef in award-winning restaurants. Pick up useful tips and tricks to prepare healthy restaurant-worthy meals.

There are many other activities and workshops available on both days! For more information, visit www.cookingguru.com.
Registration for workshops opens on 12 September 2024.
Sign up for your preferred workshop at www.cookingguru.com/register.
Limited slots are available, so hurry and sign up now!

Cooking Guru Competition 2024
Gear up for an exhilarating battle among home cooks to win the Cooking Guru 2024 title! Held on the final day of the Festival, aspiring cooks will be preparing a dish of their choice in front of a live audience made up of Festival attendees. Celebrity judges will observe and evaluate the preparation methods used, then taste and score the dishes to decide on the ultimate winner.

Prizes to be won!
Winner: $10 000
1st runner up: $5000
2nd runner up: $3000
Winner's Trophy
High-quality cooking equipment (all finalists)

Do you want to be the next Cooking Guru participant? To join the competition, simply record a video of yourself preparing a dish according to this year's theme and upload it on www.cookingguru.com/competition by 1 September 2024. If you are shortlisted, you will be invited to be a finalist!

Competition Timeline
Send in your video entry. Theme: Spectacular Singapore.
Selection committee decides on the finalists based on the video entries by 15 September 2024.
Finalists are given an hour to cook in front of a live audience.
Special appearance of Cooking Guru 2023 winner to present the Winner's Trophy.
Cooking Guru 2024 champion is announced.
Judges taste and score finalists' dishes.

Organiser: Cooking Guru Company
Sponsors: LeCruise Cookware, OatStanding Healthy Snacks, KitchenMaid Baking Supplies`,
      questions: [
        { id: 21, type: 'mcq', question: 'What is the main purpose of this advertisement?', options: ['to entice people to be a chef', 'to empower people to prepare healthy meals', 'to educate people through the various workshops', 'to encourage people to attend the cooking guru festival'], answer: 'to encourage people to attend the cooking guru festival', topic: 'Reading & Viewing' },
        { id: 22, type: 'mcq', question: 'Why is there an exclamation mark at the end of the sentence "Limited slots are available, so hurry and sign up now!"?', options: ['to warn the reader to sign up', 'to highlight the many activities', 'to create excitement about the workshops', 'to convey a sense of urgency for interested parties to sign up'], answer: 'to convey a sense of urgency for interested parties to sign up', topic: 'Reading & Viewing' },
        { id: 23, type: 'mcq', question: 'Ahmad would like to attend the talk with Chef John Chiang. When can he start signing up?', options: ['1 September 2024', '12 September 2024', '15 September 2024', '21 September 2024'], answer: '12 September 2024', topic: 'Reading & Viewing' },
        { id: 24, type: 'mcq', question: 'Which of the following statements is true?', options: ['The Cooking Guru Competition lasts for two days.', 'Chef John Chiang has won many awards as a head chef.', 'Chef Taylor Fennel is famous for his perfect poached eggs.', 'The pancake workshop allows attendees to try making both sweet and savoury pancakes.'], answer: 'The pancake workshop allows attendees to try making both sweet and savoury pancakes.', topic: 'Reading & Viewing' },
        { id: 25, type: 'mcq', question: 'Which of these companies most likely sponsored the high-quality cooking equipment to be given to all finalists?', options: ['LeCruise Cookware', 'Cooking Guru Company', 'KitchenMaid Baking Supplies', 'OatStanding Healthy Snacks'], answer: 'LeCruise Cookware', topic: 'Reading & Viewing' },
        { id: 26, type: 'mcq', question: 'Which is one of the steps required to become a finalist for Cooking Guru Competition 2024?', options: ['cook in front of many people', 'email the selection committee', 'make a video of yourself cooking', 'visit www.cookingguru.com/register'], answer: 'make a video of yourself cooking', topic: 'Reading & Viewing' },
        { id: 27, type: 'mcq', question: 'Uncle John is confident that he would be one of the finalists. While waiting for the invitation to join the cooking competition, he should', options: ['improve his skills in making the pancake flip', 'find out who the judges are and befriend them', 'send his video to all the celebrity judges who will be there', 'perfect his uniquely Singaporean dish preparation methods'], answer: 'perfect his uniquely Singaporean dish preparation methods', topic: 'Reading & Viewing' },
        { id: 28, type: 'mcq', question: 'Which statement is not true of the Cooking Guru Festival 2024?', options: ['You will only learn how to design pretty pancakes.', 'You will learn different healthy ways of cooking eggs.', 'You can pick up useful tips to prepare restaurant-worthy meals.', 'You can watch the finalists in the cooking competition on the second day of the festival.'], answer: 'You will only learn how to design pretty pancakes.', topic: 'Reading & Viewing' },
      ],
    },
    {
      title: 'Cloze Passage',
      instructions: `From the list of words given, choose the most suitable word for each blank. Write its letter (A to Q) in the blank. The letters (I) and (O) have been omitted to avoid confusion during marking.`,
      wordBank: ['(A) across', '(B) after', '(C) also', '(D) and', '(E) around', '(F) as', '(G) before', '(H) each', '(J) for', '(K) in', '(L) into', '(M) our', '(N) the', '(P) these', '(Q) under'],
      passage:
        "New Year's Day is celebrated around the world, with each culture showcasing its own unique set of traditions. In Taiwan, families gather to write wishes and hopes on sky lanterns (29)___ releasing them into the night sky. In Japan, the new year brings families together for the first shrine visit of the year. Families may also engage (30)___ other traditions such as the first calligraphy writing of the year (31)___ the eating of long noodles for a long life. Similarly, among Native American tribes, New Year's ceremonies hold spiritual significance. Rituals vary (32)___ tribes but often involve communal feasting and traditional dances performed (33)___ roaring bonfires. These ceremonies serve not only to welcome the new year but to strengthen and deepen their long ancestral connection (34)___ to the land they have inhabited for centuries. Elders will take (35)___ opportunity to pass down ancient teachings through storytelling. In Spain, New Year's Eve is a vibrant affair marked by lively street parties and family gatherings. (36)___ midnight approaches, tradition dictates eating twelve grapes, one for (37)___ stroke of the clock, symbolising good luck for the twelve months ahead. From the colourful lantern festivals of Taiwan to the solemn ceremonies of Native American tribes, (38)___ celebrations showcase how humans bid farewell to the old and embrace the new. No matter the country, all these traditions have one thing in common - starting the new year with loved ones around us.",
      questions: [
        { id: 29, type: 'dropdown', answer: 'before', topic: 'Grammar' },
        { id: 30, type: 'dropdown', answer: 'in', topic: 'Grammar' },
        { id: 31, type: 'dropdown', answer: 'and', topic: 'Grammar' },
        { id: 32, type: 'dropdown', answer: 'across', topic: 'Grammar' },
        { id: 33, type: 'dropdown', answer: 'around', topic: 'Grammar' },
        { id: 34, type: 'dropdown', answer: 'also', topic: 'Grammar' },
        { id: 35, type: 'dropdown', answer: 'the', topic: 'Grammar' },
        { id: 36, type: 'dropdown', answer: 'as', topic: 'Grammar' },
        { id: 37, type: 'dropdown', answer: 'each', topic: 'Grammar' },
        { id: 38, type: 'dropdown', answer: 'these', topic: 'Grammar' },
      ],
    },
    {
      title: 'Spelling & Grammar Correction',
      instructions: `Each of the highlighted words shown in brackets contains either a spelling or grammatical error. Write the correct word in each of the boxes.`,
      passage: `Once, there was a very hardworking farmer. He was [renound] for raising exceptionally large and plump chickens. All the people in the land called him "King of Poultry". The king of the country was very angry when he came to [knew] that someone else had also used the title of 'King'. He was [envyious] that everyone admired the farmer so he ordered his [soilders] to bring the farmer to him. When the farmer appeared [after] the king, the angry and jealous king said, "How dare you call yourself a king? If you are really a king, I want you to bring me a rooster that can lay eggs. If you can't, you will die!" The farmer returned home, feeling [angcious]. When his ten-year-old grandson saw this, he asked his grandfather what [is] wrong. The farmer told his grandson everything. The boy told his grandfather not to worry. He asked his grandfather to stay at home [where] he himself went to see the king on his behalf. At the palace, the king asked the boy, "Where is your grandfather?" "My grandfather is at home," the boy replied, "He is giving birth to a baby." The king was [baffeled]. "How can your grandfather, a man, give birth to a baby?" he asked. The boy answered, "[Unless] a man cannot give birth to a baby, then how can a rooster lay eggs?" The king was [inpressed] with the boy's clever answer. He let the boy go and pardoned the farmer from [the] same time. The farmer was thankful that his grandson had saved his life.`,
      questions: [
        { id: 39, type: 'text_input', original: 'renound', answer: 'renowned', topic: 'Grammar' },
        { id: 40, type: 'text_input', original: 'knew', answer: 'know', topic: 'Grammar' },
        { id: 41, type: 'text_input', original: 'envyious', answer: 'envious', topic: 'Grammar' },
        { id: 42, type: 'text_input', original: 'soilders', answer: 'soldiers', topic: 'Grammar' },
        { id: 43, type: 'text_input', original: 'after', answer: 'before', topic: 'Grammar' },
        { id: 44, type: 'text_input', original: 'angcious', answer: 'anxious', topic: 'Grammar' },
        { id: 45, type: 'text_input', original: 'is', answer: 'was', topic: 'Grammar' },
        { id: 46, type: 'text_input', original: 'where', answer: 'while', topic: 'Grammar' },
        { id: 47, type: 'text_input', original: 'baffeled', answer: 'baffled', topic: 'Grammar' },
        { id: 48, type: 'text_input', original: 'Unless', answer: 'If', topic: 'Grammar' },
        { id: 49, type: 'text_input', original: 'inpressed', answer: 'impressed', topic: 'Grammar' },
        { id: 50, type: 'text_input', original: 'the', answer: 'at', topic: 'Grammar' },
      ],
    },
    {
      title: 'Fill in the Blanks',
      instructions: `Fill in each blank with a suitable word.`,
      passage: `The debate over whether smartphones should be allowed in primary schools is a hot topic among students, teachers, and parents. Smartphones can be a valuable educational tool. They give students (51)___ to educational apps, online resources, and interactive learning platforms. Smartphones allow for (52)___ communication between students and their parents. Parents can quickly reach (53)___ to their children during the school day and students can contact their parents in case of (54)___ or changes in plans. In today's world, digital skills are essential. Allowing smartphones in primary schools helps students become familiar (55)___ technology, teaching them how to use it responsibly. This prepares them for future academic and career opportunities where technology (56)___ a big role. However, one of the biggest concerns about smartphones in schools is the potential for distractions. Students might be (57)___ to play games, browse social media, or text friends instead of (58)___ attention to their lessons. This can negatively impact (59)___ learning and classroom environment. Smartphones can (60)___ young students to cyberbullying and social pressures. Children may face bullying through messaging apps or social media, which can (61)___ their emotional well-being. It is crucial for schools to have strategies in place to handle (62)___ issues if smartphones are allowed. Not all students have smartphones (63)___ an internet connection. Allowing smartphones in school might create inequality (64)___ students, with some having the latest devices while (65)___ do not. This can make those without them feel left out or embarrassed. While smartphones have many educational benefits, they also come with challenges that need to be dealt with.`,
      questions: [
        { id: 51, type: 'text_input', answer: 'access', topic: 'Vocabulary' },
        { id: 52, type: 'text_input', answer: 'easy', topic: 'Vocabulary' },
        { id: 53, type: 'text_input', answer: 'out', topic: 'Vocabulary' },
        { id: 54, type: 'text_input', answer: 'emergencies', topic: 'Vocabulary' },
        { id: 55, type: 'text_input', answer: 'with', topic: 'Vocabulary' },
        { id: 56, type: 'text_input', answer: 'plays', topic: 'Vocabulary' },
        { id: 57, type: 'text_input', answer: 'tempted', topic: 'Vocabulary' },
        { id: 58, type: 'text_input', answer: 'paying', topic: 'Vocabulary' },
        { id: 59, type: 'text_input', answer: 'their', topic: 'Vocabulary' },
        { id: 60, type: 'text_input', answer: 'expose', topic: 'Vocabulary' },
        { id: 61, type: 'text_input', answer: 'affect', topic: 'Vocabulary' },
        { id: 62, type: 'text_input', answer: 'such', topic: 'Vocabulary' },
        { id: 63, type: 'text_input', answer: 'or', topic: 'Vocabulary' },
        { id: 64, type: 'text_input', answer: 'among', topic: 'Vocabulary' },
        { id: 65, type: 'text_input', answer: 'others', topic: 'Vocabulary' },
      ],
    },
    {
      title: 'Sentence Synthesis',
      instructions: `Rewrite the given sentence(s) using the word(s) provided. Your answer must be in one sentence. The meaning of your sentence must be the same as the meaning of the given sentence(s).`,
      questions: [
        { id: 66, type: 'textarea', question: 'Ahmad did not complete his homework. He watched the World Cup Final on television.', prompt: 'Instead of', answer: 'Instead of completing his homework, Ahmad watched the World Cup Final on television.', topic: 'Writing & Representing' },
        { id: 67, type: 'textarea', question: '"Have you paid for your ticket to the Bird Paradise?" my teacher asked me.', prompt: 'My teacher asked me', answer: 'My teacher asked me if I had paid for my ticket to the Bird Paradise.', topic: 'Writing & Representing' },
        { id: 68, type: 'textarea', question: 'I tried very hard to persuade Mrs Lim but she refused to join the baking class.', prompt: 'No matter', answer: 'No matter how hard I tried to persuade Mrs Lim, she refused to join the baking class.', topic: 'Writing & Representing' },
        { id: 69, type: 'textarea', question: 'All the children were pleased with their gifts. Linda was not pleased with her gift.', prompt: 'except', answer: 'All the children except Linda were pleased with their gifts.', topic: 'Writing & Representing' },
        { id: 70, type: 'textarea', question: 'They were annoyed as Sally was insincere.', prompt: "Sally's", answer: "Sally's insincerity annoyed them.", topic: 'Writing & Representing' },
      ],
    },
    {
      title: 'Reading Comprehension',
      instructions: `Read the passage below and answer the questions that follow.`,
      passage: `Secondary school was challenging for me, but it taught me the meaning of seeing the light at the end of the tunnel. Secondary two was a unique year. In secondary one, I was below average in height but average in weight and athleticism, but during the summer break and before secondary two, my appetite became insatiable. Despite consuming large amounts of food, my hunger persisted. I was not concerned about it. I just assumed it was all caused by me working hard on a farm.\n\nHowever, at the start of secondary two, I found myself feeling awkward and my clumsiness had reached the point where I could easily stumble over my own feet. To make matters worse, my trousers had become two sizes smaller after I put on seven kilogrammes. My physical education teacher was shocked at my growth, exclaiming, "This can't be true! You've grown twelve centimetres in three months?" He remeasured my height several times before accepting and recording it.\n\nWhile I grew taller, my self-confidence lagged behind. My shoe size jumped two sizes from size 9 to size 11 and my feet, seemingly with minds of their own, refused to coordinate with the rest of me. During physical education lessons, I often tripped over my own feet while dribbling a basketball, causing me to fall amid the laughter of a few of my classmates. When I picked myself up and glared at them, they would flinch. I occasionally heard them whisper "Clumsy", especially when they thought I would not hear them, given my new size. I was way taller and bigger than all of them, which made them uneasy.\n\nMy greatest dread arrived - a month of dance practice in physical education to prepare for the School Bash Dance. I considered skipping school. But, what excuses could I give? I had no choice but to endure. I already felt inadequate in my social skills when it came to interacting with girls. The thought that my clumsiness would plunge my popularity rating even further gripped my heart with great trepidation.\n\nAfter four dances, my partner limped away like the others before her. Then, the teacher said we would dance in socks. This must be done in consideration of sparing the girls from my big shoes. She looked right at me when announcing it, gave me a wink and a thumbs-up. She had been trying to convince me that effort was far more important than perfection. We practised until The Day, which I feared would be my worst day. Partners were to be chosen, not assigned, with girls picking first. As they hurried to select, I braced to be the last boy standing. Soon, nearly all the boys were chosen. I was looking down, so I did not have to face the events unfolding around me. Then I thought I heard my name and looked up to meet the gaze of a pair of bright eyes. She smiled kindly at me. She had to repeat herself before I realised she was speaking to me. As I timidly took her hand to escort her to the dance floor, I decided to warn her, "I don't dance very well."\n\nShe smiled warmly and replied, "That doesn't matter. I'm not a great dancer either. Let's give it our best shot together."\n\nYou know what? Secondary two was really one of the best years of my life.`,
      questions: [
        { id: 71, type: 'open_ended', question: 'Based on the first paragraph, explain what the narrator initially believed caused his insatiable appetite.', answer: 'The narrator initially believed that the hard work he was doing on the farm caused his insatiable appetite.', topic: 'Reading & Viewing' },
        {
          id: 72,
          type: 'open_ended',
          question: `Fill in the following table to show the narrator's physical appearance and how he felt before and at the start of secondary 2 based on lines 2-16.`,
          answer: `Before: Physical appearance - Below average in height but average in weight. Feeling - Unconcerned. At the start of Sec 2: Physical appearance - Grew twelve centimetres, put on seven kilogrammes, shoe size grew two sizes bigger. Feeling - Awkward.`,
          topic: 'Reading & Viewing',
        },
        { id: 73, type: 'open_ended', question: 'Which three-word phrase from lines 17-21 tells us that the narrator showed his displeasure with his classmates?', answer: 'glared at them', topic: 'Reading & Viewing' },
        {
          id: 74,
          type: 'open_ended',
          question: `Based on the passage, state whether each statement is true or false and provide a reason. a) The narrator was proud of his rapid physical growth. b) The narrator's growth spurt was first met with disbelief by his PE teacher. c) The decision to dance in socks was mainly to prevent injuries from the narrator's clumsiness.`,
          answer: `a) False. His self-confidence lagged behind although he grew taller. b) True. His PE teacher remeasured his height several times before accepting it. c) True. After four dances, his partner limped away due to the narrator's big shoes and clumsiness.`,
          topic: 'Reading & Viewing',
        },
        {
          id: 75,
          type: 'open_ended',
          question: `What do the words in the left column refer to in the passage? a) their (line 15) b) the others (line 27)`,
          answer: `a) The narrator's feet. b) The previous girls who had been the narrator's dance partners.`,
          topic: 'Reading & Viewing',
        },
        { id: 76, type: 'open_ended', question: 'Why was it not practical for the narrator to consider skipping school due to his problem?', answer: 'It would be impractical to skip school because he had no excuses to give.', topic: 'Reading & Viewing' },
        {
          id: 77,
          type: 'open_ended',
          question: `Describe two things the narrator's teacher did to help him.`,
          answer: `a) She asked everyone to dance in socks so the girls would not get hurt by the narrator. b) She gave him a wink and a thumbs-up to encourage him.`,
          topic: 'Reading & Viewing',
        },
        { id: 78, type: 'open_ended', question: 'In line 32, why did the narrator fear that the School Bash Dance day would be his worst day?', answer: 'Partners were to be chosen, not assigned, and he feared not being chosen by any of the girls.', topic: 'Reading & Viewing' },
        {
          id: 79,
          type: 'open_ended',
          question: `Explain clearly why the narrator decided to tell the girl in line 39 "I don't dance very well".`,
          answer: `He wanted to warn her that he could not dance well as he lacked confidence in his dance abilities.`,
          topic: 'Reading & Viewing',
        },
        {
          id: 80,
          type: 'open_ended',
          question: `a) Which word best describes the narrator's tone when reflecting on secondary two as 'one of the best years of my life'? (hilarious, indifferent, regretful, surprised) b) Why do you think so?`,
          answer: `a) surprised. b) The incident at the School Dance Bash where the narrator was unexpectedly chosen by a girl as her dance partner was a surprising positive experience that made him reflect on secondary two as one of the best years.`,
          topic: 'Reading & Viewing',
        },
      ],
    },
  ],
};

export default exam;
