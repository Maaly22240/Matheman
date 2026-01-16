const mongoose = require('mongoose');
// Change how we import the Quiz model
const Quiz = require('../models/Quiz');
const Chapter = require('../models/Chapter');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/DBC');
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Get chapter IDs for linking quizzes
const getChapterIds = async () => {
    try {
        const chapters = await Chapter.find().select('_id name');
        console.log(`Found ${chapters.length} chapters`);
        return chapters;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
    }
};

// Create algebra quizzes
const createAlgebraQuizzes = async (chapterId) => {
    const quizzes = [
        {
            title: "Algebra Fundamentals - Recall Quiz",
            description: "Test your understanding of algebraic expressions and variables",
            chapter: chapterId,
            type: "recall",
            questions: [
                {
                    question: "What does a variable represent in algebra?",
                    options: [
                        "A fixed value that never changes",
                        "An unknown or changing value",
                        "Only negative numbers",
                        "Only the letter x"
                    ],
                    correctAnswer: "An unknown or changing value",
                    explanation: "Variables are symbols used to represent unknown or changing values."
                },
                {
                    question: "What is the value of 3x when x = 5?",
                    options: ["8", "15", "5", "3"],
                    correctAnswer: "15",
                    explanation: "To find the value, substitute x = 5 into 3x: 3 × 5 = 15"
                },
                {
                    question: "What is PEMDAS used for in algebra?",
                    options: [
                        "For factoring polynomials",
                        "For remembering the order of operations",
                        "For solving systems of equations",
                        "For graphing functions"
                    ],
                    correctAnswer: "For remembering the order of operations",
                    explanation: "PEMDAS stands for Parentheses, Exponents, Multiplication/Division, Addition/Subtraction, which is the standard order of operations."
                }
            ]
        },
        {
            title: "Algebraic Problem-Solving - Interleaved Practice",
            description: "Practice different types of algebra problems mixed together",
            chapter: chapterId,
            type: "interleaved",
            questions: [
                {
                    question: "Simplify: 2(x + 3) - 5",
                    options: ["2x + 6 - 5", "2x + 1", "2x + 6", "2x - 2"],
                    correctAnswer: "2x + 1",
                    explanation: "2(x + 3) - 5 = 2x + 6 - 5 = 2x + 1"
                },
                {
                    question: "Solve for x: 3x + 7 = 22",
                    options: ["x = 5", "x = 7", "x = 15", "x = 29"],
                    correctAnswer: "x = 5",
                    explanation: "3x + 7 = 22\n3x = 15\nx = 5"
                },
                {
                    question: "If y = 2x - 5, what is the value of y when x = 6?",
                    options: ["7", "1", "-17", "17"],
                    correctAnswer: "7",
                    explanation: "Substitute x = 6 into y = 2x - 5\ny = 2(6) - 5 = 12 - 5 = 7"
                },
                {
                    question: "Factor: x² - 9",
                    options: ["(x + 3)(x - 3)", "(x + 9)(x - 1)", "(x - 3)²", "(x + 9)(x - 9)"],
                    correctAnswer: "(x + 3)(x - 3)",
                    explanation: "x² - 9 is a difference of squares: a² - b² = (a + b)(a - b)\nSo x² - 9 = x² - 3² = (x + 3)(x - 3)"
                }
            ]
        },
        {
            title: "Spaced Repetition: Algebra Concepts",
            description: "Strengthen your memory of key algebraic concepts",
            chapter: chapterId,
            type: "spaced-repetition",
            questions: [
                {
                    question: "What type of algebraic expression is 3x + 2?",
                    options: ["Monomial", "Binomial", "Trinomial", "Polynomial"],
                    correctAnswer: "Binomial",
                    explanation: "A binomial has exactly two terms. 3x + 2 has two terms: 3x and 2."
                },
                {
                    question: "What is the degree of the polynomial x³ + 4x² - 5x + 7?",
                    options: ["1", "2", "3", "4"],
                    correctAnswer: "3",
                    explanation: "The degree of a polynomial is the highest exponent of its variable, which in this case is 3 from x³."
                },
                {
                    question: "Which of these is NOT a solution to the equation x² - 4 = 0?",
                    options: ["x = 2", "x = -2", "x = 0", "x = √4"],
                    correctAnswer: "x = 0",
                    explanation: "The solutions are x = 2 and x = -2. When x = 0, we get 0² - 4 = -4, which is not equal to 0."
                }
            ]
        }
    ];
    
    return quizzes;
};

// Create geometry quizzes
const createGeometryQuizzes = async (chapterId) => {
    const quizzes = [
        {
            title: "Geometry Basics - Recall Quiz",
            description: "Test your knowledge of fundamental geometric concepts",
            chapter: chapterId,
            type: "recall",
            questions: [
                {
                    question: "What is the sum of interior angles in a triangle?",
                    options: ["90°", "180°", "270°", "360°"],
                    correctAnswer: "180°",
                    explanation: "The sum of interior angles in any triangle is always 180 degrees."
                },
                {
                    question: "In a right triangle, what is the relationship between the sides according to the Pythagorean theorem?",
                    options: [
                        "a + b = c",
                        "a² + b² = c²",
                        "a × b = c",
                        "a² - b² = c²"
                    ],
                    correctAnswer: "a² + b² = c²",
                    explanation: "The Pythagorean theorem states that the square of the hypotenuse (c) equals the sum of squares of the other two sides (a and b)."
                },
                {
                    question: "What type of angle is 75°?",
                    options: ["Acute", "Right", "Obtuse", "Straight"],
                    correctAnswer: "Acute",
                    explanation: "An acute angle measures less than 90 degrees."
                },
                {
                    question: "What is the formula for the area of a circle?",
                    options: ["A = πr", "A = πr²", "A = 2πr", "A = πd"],
                    correctAnswer: "A = πr²",
                    explanation: "The area of a circle is π multiplied by the square of the radius."
                }
            ]
        },
        {
            title: "Geometry Applications - Contextual Variation",
            description: "Apply geometric concepts in different contexts",
            chapter: chapterId,
            type: "contextual-variation",
            questions: [
                {
                    question: "A rectangular garden has a perimeter of 36 meters and a width of 6 meters. What is its length?",
                    options: ["12 meters", "18 meters", "24 meters", "30 meters"],
                    correctAnswer: "12 meters",
                    explanation: "Perimeter = 2(length + width) = 36m\n2(length + 6) = 36\nLength + 6 = 18\nLength = 12m"
                },
                {
                    question: "A circular pizza has a diameter of 14 inches. What is its area in square inches? (Use π ≈ 3.14)",
                    options: ["43.96", "153.86", "615.44", "21.98"],
                    correctAnswer: "153.86",
                    explanation: "Area = πr² = π(d/2)² = 3.14 × (14/2)² = 3.14 × 49 ≈ 153.86 square inches"
                },
                {
                    question: "A ladder 10 feet long leans against a vertical wall. If the bottom of the ladder is 6 feet from the wall, how high up the wall does the ladder reach?",
                    options: ["4 feet", "8 feet", "10 feet", "16 feet"],
                    correctAnswer: "8 feet",
                    explanation: "Using the Pythagorean theorem: 6² + h² = 10²\n36 + h² = 100\nh² = 64\nh = 8 feet"
                }
            ]
        },
        {
            title: "Geometric Proofs - Encoding Practice",
            description: "Practice encoding geometric concepts for better retention",
            chapter: chapterId,
            type: "encoding",
            questions: [
                {
                    question: "Which property allows us to conclude that two triangles are congruent if all three sides of one triangle are equal to the corresponding sides of the other triangle?",
                    options: ["SAS (Side-Angle-Side)", "ASA (Angle-Side-Angle)", "SSS (Side-Side-Side)", "AAS (Angle-Angle-Side)"],
                    correctAnswer: "SSS (Side-Side-Side)",
                    explanation: "The SSS (Side-Side-Side) congruence criterion states that if three sides of one triangle are equal to three sides of another triangle, the triangles are congruent."
                },
                {
                    question: "What's the best way to remember the formula for the area of a trapezoid?",
                    options: [
                        "Average the parallel sides, then multiply by the height",
                        "Add the parallel sides, multiply by the height, then divide by 2",
                        "Subtract the parallel sides, multiply by the height",
                        "Multiply the parallel sides, then multiply by the height"
                    ],
                    correctAnswer: "Add the parallel sides, multiply by the height, then divide by 2",
                    explanation: "Area of trapezoid = (1/2) × h × (a + b), where h is the height and a and b are the parallel sides."
                },
                {
                    question: "Which visual aid helps remember the relationship between radius, diameter, and circumference of a circle?",
                    options: [
                        "Drawing the radius and counting how many fit around the circle",
                        "Drawing a square around the circle",
                        "Drawing a triangle inside the circle",
                        "Drawing tangent lines to the circle"
                    ],
                    correctAnswer: "Drawing the radius and counting how many fit around the circle",
                    explanation: "If you place radius-length segments around the circumference, approximately 6 will fit, suggesting that the circumference is about 6 times the radius, or 3 times the diameter, approximating the value of π."
                }
            ]
        }
    ];
    
    return quizzes;
};

// Create statistics quizzes
const createStatisticsQuizzes = async (chapterId) => {
    const quizzes = [
        {
            title: "Statistics Fundamentals - Recall Quiz",
            description: "Test your knowledge of basic statistical concepts",
            chapter: chapterId,
            type: "recall",
            questions: [
                {
                    question: "What is the mean of the data set: 5, 8, 12, 15, 20?",
                    options: ["10", "12", "13", "15"],
                    correctAnswer: "12",
                    explanation: "Mean = (5 + 8 + 12 + 15 + 20) / 5 = 60 / 5 = 12"
                },
                {
                    question: "What does the standard deviation measure?",
                    options: [
                        "The average value of a data set",
                        "The middle value of a data set",
                        "The spread or dispersion of data from the mean",
                        "The most frequently occurring value in a data set"
                    ],
                    correctAnswer: "The spread or dispersion of data from the mean",
                    explanation: "The standard deviation measures how spread out the values in a data set are from the mean."
                },
                {
                    question: "Which measure of central tendency is most resistant to outliers?",
                    options: ["Mean", "Median", "Mode", "Range"],
                    correctAnswer: "Median",
                    explanation: "The median is less affected by extreme values (outliers) than the mean because it's based on position rather than the actual values."
                }
            ]
        },
        {
            title: "Probability Concepts - Interleaved Practice",
            description: "Apply various probability concepts to different scenarios",
            chapter: chapterId,
            type: "interleaved",
            questions: [
                {
                    question: "When flipping a fair coin, what is the probability of getting heads?",
                    options: ["1/4", "1/3", "1/2", "2/3"],
                    correctAnswer: "1/2",
                    explanation: "A fair coin has two equally likely outcomes: heads or tails. So the probability is 1 out of 2, or 1/2."
                },
                {
                    question: "If you roll two fair six-sided dice, what is the probability of getting a sum of 7?",
                    options: ["1/6", "1/12", "5/36", "6/36"],
                    correctAnswer: "6/36",
                    explanation: "There are 36 possible outcomes when rolling two dice. Six of these give a sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). So the probability is 6/36 = 1/6."
                },
                {
                    question: "In a standard deck of 52 cards, what is the probability of drawing a queen or a king?",
                    options: ["1/13", "2/13", "8/52", "4/13"],
                    correctAnswer: "8/52",
                    explanation: "There are 4 queens and 4 kings in a standard deck, for a total of 8 cards out of 52. So the probability is 8/52 = 2/13."
                },
                {
                    question: "If the probability of an event occurring is 0.35, what is the probability that it does NOT occur?",
                    options: ["0.35", "0.65", "0.5", "0.75"],
                    correctAnswer: "0.65",
                    explanation: "The sum of the probabilities of an event occurring and not occurring is 1. So if P(event) = 0.35, then P(not event) = 1 - 0.35 = 0.65."
                }
            ]
        },
        {
            title: "Statistical Analysis - Encoding Techniques",
            description: "Learn memory techniques for statistical concepts",
            chapter: chapterId,
            type: "encoding",
            questions: [
                {
                    question: "Which memory device can help remember the difference between a parameter and a statistic?",
                    options: [
                        "Parameters are Primary (population), Statistics are Secondary (sample)",
                        "Parameters are Partial, Statistics are Solid",
                        "Parameters are Proven, Statistics are Suggested",
                        "Parameters are Personal, Statistics are Social"
                    ],
                    correctAnswer: "Parameters are Primary (population), Statistics are Secondary (sample)",
                    explanation: "This mnemonic uses alliteration to help remember that parameters relate to the population and statistics relate to samples."
                },
                {
                    question: "What visual technique helps understand the relationship between mean, median, and mode in skewed distributions?",
                    options: [
                        "Drawing a number line with the three values marked",
                        "Creating a stem-and-leaf plot",
                        "Drawing the skewed curve and noting how the mean 'pulls' toward the tail",
                        "Plotting each value as a bar graph"
                    ],
                    correctAnswer: "Drawing the skewed curve and noting how the mean 'pulls' toward the tail",
                    explanation: "Visualizing a skewed distribution helps remember that the mean is pulled toward the tail, the median is more central, and the mode is at the peak."
                },
                {
                    question: "Which acronym helps remember the four types of measurement scales?",
                    options: ["NOIR", "IRON", "NORI", "RINO"],
                    correctAnswer: "NOIR",
                    explanation: "NOIR stands for Nominal, Ordinal, Interval, and Ratio - the four types of measurement scales in statistics, in order of increasing mathematical properties."
                }
            ]
        }
    ];
    
    return quizzes;
};

// Save quizzes to database
const saveQuizzes = async (quizzes) => {
    try {
        // First delete all existing quizzes using collection directly
        await mongoose.connection.collection('quizzes').deleteMany({});
        console.log('Deleted existing quizzes');
        
        // Save new quizzes - make sure we use Quiz, not QuizModel
        const result = await Quiz.insertMany(quizzes);
        console.log(`Successfully added ${result.length} quizzes to database`);
        
        // Update the chapters with references to their quizzes
        for (const quiz of result) {
            await Chapter.findByIdAndUpdate(quiz.chapter, {
                $push: { quizzes: quiz._id }
            });
        }
        
        console.log('Updated chapters with quiz references');
    } catch (error) {
        console.error('Error saving quizzes:', error);
    }
};

// New function to assign quizzes to all chapters
const assignQuizzesToAllChapters = async (chapters) => {
    let quizzes = [];
    
    // Make sure we have at least one chapter
    if (chapters.length === 0) {
        console.log('No chapters found. Please create chapters first.');
        return [];
    }
    
    // Assign quizzes to every chapter in a round-robin fashion
    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterIndex = i % 3; // Cycle through 0, 1, 2 for different quiz types
        
        console.log(`Assigning quizzes to chapter: ${chapter.name} (${chapter._id}), type index: ${chapterIndex}`);
        
        let chapterQuizzes;
        switch (chapterIndex) {
            case 0:
                chapterQuizzes = await createAlgebraQuizzes(chapter._id);
                break;
            case 1:
                chapterQuizzes = await createGeometryQuizzes(chapter._id);
                break;
            case 2:
            default:
                chapterQuizzes = await createStatisticsQuizzes(chapter._id);
                break;
        }
        
        quizzes = [...quizzes, ...chapterQuizzes];
    }
    
    return quizzes;
};

// Main function to run the script - replacing the existing populateQuizzes function
const populateQuizzes = async () => {
    await connectDB();
    
    try {
        const chapters = await getChapterIds();
        if (chapters.length === 0) {
            console.log('No chapters found. Please create chapters first.');
            return;
        }
        
        // Use the new function that assigns quizzes to all chapters
        const quizzes = await assignQuizzesToAllChapters(chapters);
        
        await saveQuizzes(quizzes);
        console.log('Quiz population completed successfully!');
    } catch (error) {
        console.error('Error in quiz population script:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
populateQuizzes();
