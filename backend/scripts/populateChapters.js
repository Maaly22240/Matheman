const mongoose = require('mongoose');
const Chapter = require('../models/Chapter');
const Domain = require('../models/Domain');
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

// Sample chapter data for Algebra
const algebraChapter = {
    name: "Algebra Foundations",
    summary: "Master the fundamental concepts of algebra including variables, expressions, and equations.",
    content: "Algebra is the language of mathematics that allows us to express mathematical relationships using variables and symbols.",
    sections: [
        {
            title: "Understanding Variables",
            content: `# Variables: The Building Blocks of Algebra

Variables are symbols (usually letters like x, y, z) that represent unknown or changing values. 

## Key Concepts:
- A variable can take different values
- In the expression 3x, the variable x is multiplied by 3
- Variables allow us to write general formulas and equations

**Example:** If x = 5, then 3x = 3 × 5 = 15

### Active Recall Exercise:
Think about what values you could substitute for the variable y in the expression 2y + 3.`,
            type: "theory",
            images: ["https://mathemann.org/images/variables_intro.png"],
            order: 1
        },
        {
            title: "Algebraic Expressions",
            content: `# Working with Expressions

Algebraic expressions combine variables and constants using operations like addition, subtraction, multiplication, and division.

## Types of Expressions:
- Monomial: A single term (ex: 5x)
- Binomial: Two terms (ex: 3y + 2)
- Polynomial: Multiple terms (ex: x² + 3x - 7)

## Mnemonic Technique for Order of Operations: "PEMDAS"
- **P**arentheses
- **E**xponents
- **M**ultiplication and **D**ivision (from left to right)
- **A**ddition and **S**ubtraction (from left to right)

Think: "Please Excuse My Dear Aunt Sally"`,
            type: "mnemonic",
            images: ["https://mathemann.org/images/algebraic_expressions.png"],
            order: 2
        },
        {
            title: "Chunking Algebraic Problems",
            content: `# Breaking Down Complex Problems

When faced with a complex algebraic problem, breaking it down into smaller chunks makes it more manageable.

## Chunking Method:
1. Identify what you're solving for
2. Group similar terms
3. Solve each chunk step by step
4. Combine results

### Example:
Solve: 2(3x + 4) - 5x = 12

Chunk 1: Simplify 2(3x + 4) = 6x + 8
Chunk 2: 6x + 8 - 5x = 12
Chunk 3: x + 8 = 12
Chunk 4: x = 4

This technique helps manage cognitive load when solving complex problems.`,
            type: "chunking",
            order: 3
        },
        {
            title: "Interleaved Practice Session",
            content: `# Mixed Practice Problems

This section deliberately mixes different types of problems to strengthen your ability to identify appropriate solution strategies.

Solve each problem, identifying the technique required:

1. Simplify: 3(x + 2) - 4(x - 1)
2. If x = 3, what is the value of 2x² - 5x + 1?
3. Solve for y: 2y - 5 = 11
4. Evaluate: 4 × 3 + 7²

Switching between different problem types improves long-term retention and builds mental flexibility.`,
            type: "application",
            order: 4
        }
    ],
    mnemonicDevices: [
        "PEMDAS (Please Excuse My Dear Aunt Sally) for order of operations",
        "FOIL (First, Outer, Inner, Last) for multiplying binomials"
    ],
    difficulty: "beginner",
    estimatedDuration: 45
};

// Sample chapter data for Geometry
const geometryChapter = {
    name: "Introduction to Geometry",
    summary: "Learn the foundational concepts of geometry including points, lines, angles, and shapes.",
    content: "Geometry is the branch of mathematics that deals with shapes, sizes, and properties of space.",
    sections: [
        {
            title: "Basic Geometric Elements",
            content: `# The Building Blocks of Geometry

Geometry begins with simple elements that form the basis for all geometric figures.

## Key Elements:
- **Point**: A location in space with no size (represented by a dot)
- **Line**: A straight path that extends infinitely in both directions
- **Line segment**: A portion of a line with two endpoints
- **Ray**: A portion of a line with one endpoint, extending infinitely in one direction
- **Plane**: A flat surface that extends infinitely in all directions

### Active Recall:
Take a moment to visualize each of these elements. Can you identify examples of each in the room around you?`,
            type: "theory",
            images: ["https://mathemann.org/images/geometric_elements.png"],
            order: 1
        },
        {
            title: "Angles and Their Properties",
            content: `# Understanding Angles

An angle is formed by two rays sharing a common endpoint (vertex).

## Types of Angles:
- **Acute angle**: Less than 90° (e.g., 45°)
- **Right angle**: Exactly 90° (marked with a square symbol)
- **Obtuse angle**: More than 90° but less than 180° (e.g., 120°)
- **Straight angle**: Exactly 180°
- **Reflex angle**: More than 180° but less than 360°

## Mnemonic for Angle Types:
"**A**cute is **a** small angle, **r**ight is **r**ectangular, **o**btuse is **o**ver 90°"

## Special Angle Pairs:
- **Complementary angles**: Two angles that sum to 90°
- **Supplementary angles**: Two angles that sum to 180°
- **Vertical angles**: Opposite angles formed by intersecting lines (always equal)`,
            type: "mnemonic",
            images: ["https://mathemann.org/images/angle_types.png"],
            order: 2
        },
        {
            title: "Triangles: Classification and Properties",
            content: `# The Power of Triangles

Triangles are the most fundamental polygons and have many important properties.

## Classification by Sides:
- **Equilateral**: All sides equal
- **Isosceles**: Two sides equal
- **Scalene**: No sides equal

## Classification by Angles:
- **Acute**: All angles less than 90°
- **Right**: One angle equals 90°
- **Obtuse**: One angle greater than 90°

## Chunking Triangle Properties:
1. **Sum of angles**: Always 180°
2. **Triangle inequality**: Sum of any two sides > third side
3. **Area**: (1/2) × base × height

### Pythagorean Theorem (for right triangles):
a² + b² = c² (where c is the hypotenuse)`,
            type: "chunking",
            images: ["https://mathemann.org/images/triangle_types.png"],
            order: 3
        },
        {
            title: "Contextual Applications",
            content: `# Geometry in Real Life

Geometric concepts appear in many real-world contexts.

## Architectural Applications:
- Right angles ensure buildings are structurally sound
- Triangular bracing provides stability in construction
- Circular arches distribute weight efficiently

## Navigation Applications:
- Angles are used in compass directions
- Triangulation helps determine location
- Geometric coordinates map positions

## Design Applications:
- Geometric patterns in art and fabric design
- Golden ratio (approximately 1.618:1) appears in aesthetically pleasing designs
- Symmetry creates balance in visual compositions

### Exercise:
Identify three geometric shapes or principles you've encountered today outside of this lesson.`,
            type: "application",
            images: ["https://mathemann.org/images/geometry_applications.png"],
            order: 4
        }
    ],
    mnemonicDevices: [
        "SOH-CAH-TOA for trigonometric ratios",
        "Acute is 'a' cute (small) angle below 90°", 
        "CPCTC: Corresponding Parts of Congruent Triangles are Congruent"
    ],
    difficulty: "beginner",
    estimatedDuration: 50
};

// Sample chapter data for Statistics
const statisticsChapter = {
    name: "Introduction to Statistics and Probability",
    summary: "Explore fundamental concepts of statistics and probability, including data analysis, probability calculations, and statistical measures.",
    content: "Statistics and probability provide tools to analyze data, make predictions, and understand uncertainty in various situations.",
    sections: [
        {
            title: "Data Types and Collection Methods",
            content: `# Understanding Data

Data is the foundation of statistics. Before analyzing data, we need to understand its types and collection methods.

## Data Types:
- **Qualitative data** (categorical): Describes qualities or characteristics (e.g., colors, gender)
- **Quantitative data** (numerical): Represents quantities that can be measured
  - **Discrete data**: Countable values (e.g., number of students)
  - **Continuous data**: Measurable on a continuous scale (e.g., height, time)

## Data Collection Methods:
- **Survey**: Gathering information directly from people
- **Observation**: Recording data without direct interaction
- **Experiment**: Controlled testing to determine causality
- **Existing data**: Using previously collected information

### Active Recall Exercise:
For each scenario, identify the data type:
1. Number of pets owned
2. Temperature readings
3. Favorite colors
4. Time taken to complete a test`,
            type: "theory",
            images: ["https://mathemann.org/images/data_types.png"],
            order: 1
        },
        {
            title: "Descriptive Statistics",
            content: `# Summarizing Data

Descriptive statistics help us understand and summarize data sets.

## Measures of Central Tendency:
- **Mean**: Average value (sum divided by count)
- **Median**: Middle value in ordered data
- **Mode**: Most frequently occurring value

## Measures of Dispersion:
- **Range**: Difference between maximum and minimum values
- **Variance**: Average of squared differences from the mean
- **Standard deviation**: Square root of variance

## Chunking When to Use Each Measure:
1. **Use mean when**: Data is symmetrically distributed without outliers
2. **Use median when**: Data is skewed or contains outliers
3. **Use mode when**: Finding the most common category or value
4. **Use range for**: Quick assessment of data spread
5. **Use standard deviation for**: Detailed analysis of data variability

### Example:
For the data set [2, 5, 7, 9, 11, 15]:
- Mean: (2+5+7+9+11+15)/6 = 49/6 = 8.17
- Median: (7+9)/2 = 8 (middle values)
- Mode: None (all values appear once)
- Range: 15-2 = 13`,
            type: "chunking",
            images: ["https://mathemann.org/images/descriptive_stats.png"],
            order: 2
        },
        {
            title: "Basic Probability Concepts",
            content: `# Understanding Uncertainty

Probability measures the likelihood of events occurring.

## Fundamental Concepts:
- **Experiment**: A process with a well-defined set of possible outcomes
- **Sample space**: Set of all possible outcomes
- **Event**: A subset of the sample space
- **Probability**: Number between 0 and 1 that measures likelihood

## Probability Calculation:
Probability of event A = Number of favorable outcomes / Total number of possible outcomes

## Mnemonics for Probability Rules:
- "**AND** means **M**ultiply" (for independent events)
- "**OR** means **A**dd, but don't **O**verlap" (add probabilities, but subtract the intersection)

### Key Rules:
1. Probabilities range from 0 (impossible) to 1 (certain)
2. Sum of all outcome probabilities equals 1
3. P(not A) = 1 - P(A)`,
            type: "mnemonic",
            images: ["https://mathemann.org/images/probability_basics.png"],
            order: 3
        },
        {
            title: "Interleaved Practice: Mixed Problems",
            content: `# Building Statistical Thinking

This section deliberately mixes different types of statistical problems to strengthen your ability to apply the right concept to each situation.

1. Calculate the mean, median, and mode for the data set: [3, 7, 8, 8, 10, 15]
2. If you roll a fair die, what is the probability of getting an even number?
3. A data set has a standard deviation of 0. What does this tell you about the data?
4. In a class of 30 students, 18 are female. What percentage are male?
5. If events A and B are independent with P(A) = 0.3 and P(B) = 0.4, what is P(A and B)?

Practicing different problem types improves your ability to identify which statistical concepts apply to new situations you encounter.`,
            type: "application",
            order: 4
        }
    ],
    mnemonicDevices: [
        "MEDIAN is in the MIDDLE",
        "Mean is the ARITHMETIC average",
        "AND = Multiply, OR = Add (for independent events)",
        "PEMDAS applies in probability calculations too"
    ],
    difficulty: "intermediate",
    estimatedDuration: 60
};

// Create domains if they don't exist
const createDomains = async () => {
    try {
        // Check if domains already exist
        const domainsCount = await Domain.countDocuments();
        if (domainsCount > 0) {
            console.log('Domains already exist in database');
            return await Domain.find();
        }
        
        console.log('Creating sample domains');
        
        const domains = [
            {
                name: "Algebra",
                chapters: []
            },
            {
                name: "Geometry",
                chapters: []
            },
            {
                name: "Statistics & Probability",
                chapters: []
            }
        ];
        
        const createdDomains = await Domain.insertMany(domains);
        console.log(`Created ${createdDomains.length} domains`);
        return createdDomains;
    } catch (error) {
        console.error('Error creating domains:', error);
        return [];
    }
};

// Create and save chapters
const createChapters = async (domains) => {
    try {
        // Delete any existing chapters first
        await Chapter.deleteMany({});
        console.log('Deleted existing chapters');
        
        const algebraDomain = domains.find(d => d.name === 'Algebra');
        const geometryDomain = domains.find(d => d.name === 'Geometry');
        const statisticsDomain = domains.find(d => d.name === 'Statistics & Probability');
        
        // Create chapters with domain references
        const algebraChapterWithDomain = { ...algebraChapter };
        const geometryChapterWithDomain = { ...geometryChapter };
        const statisticsChapterWithDomain = { ...statisticsChapter };
        
        // Create chapters
        const createdChapters = await Chapter.insertMany([
            algebraChapterWithDomain,
            geometryChapterWithDomain,
            statisticsChapterWithDomain
        ]);
        
        console.log(`Created ${createdChapters.length} chapters`);
        
        // Update domain with chapter references
        if (algebraDomain) {
            const algebraChapterObj = createdChapters.find(c => c.name === "Algebra Foundations");
            if (algebraChapterObj) {
                await Domain.findByIdAndUpdate(algebraDomain._id, {
                    $push: { chapters: algebraChapterObj._id }
                });
                console.log(`Added Algebra chapter to ${algebraDomain.name} domain`);
            }
        }
        
        if (geometryDomain) {
            const geometryChapterObj = createdChapters.find(c => c.name === "Introduction to Geometry");
            if (geometryChapterObj) {
                await Domain.findByIdAndUpdate(geometryDomain._id, {
                    $push: { chapters: geometryChapterObj._id }
                });
                console.log(`Added Geometry chapter to ${geometryDomain.name} domain`);
            }
        }
        
        if (statisticsDomain) {
            const statisticsChapterObj = createdChapters.find(c => c.name === "Introduction to Statistics and Probability");
            if (statisticsChapterObj) {
                await Domain.findByIdAndUpdate(statisticsDomain._id, {
                    $push: { chapters: statisticsChapterObj._id }
                });
                console.log(`Added Statistics chapter to ${statisticsDomain.name} domain`);
            }
        }
        
        return createdChapters;
    } catch (error) {
        console.error('Error creating chapters:', error);
        return [];
    }
};

// Main function to run the script
const populateChapters = async () => {
    await connectDB();
    
    try {
        const domains = await createDomains();
        if (domains.length === 0) {
            console.log('Failed to create domains. Exiting.');
            return;
        }
        
        const chapters = await createChapters(domains);
        console.log(`Successfully created ${chapters.length} chapters with pedagogical sections`);
    } catch (error) {
        console.error('Error in chapter population script:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
populateChapters();
