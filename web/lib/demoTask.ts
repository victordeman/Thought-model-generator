import { Task } from './types';

export const DEMO_TASK_STUDIERENDER: Task = {
  id: 'task-001',
  slug: 'create-studierender',
  title: 'Create & Populate Studierender Schema',
  domain: 'sql',
  brief: 'The clerk has a list of students and no table to put them in. What must exist before a single row can arrive?',
  starterState: {
    schemaSql: '-- SQLite DB ready for execution\n',
    seedSql: '',
    initialQuery: 'CREATE TABLE Studierender (\n  matrikel_nr INT PRIMARY KEY,\n  name VARCHAR(100),\n  semester INT\n);'
  },
  scenes: [
    {
      id: 'scene-1',
      order: 1,
      title: 'Scene 1: Declaring the Entity',
      narration: 'The university administration needs a structured table for student records. Formulate the database table creation.',
      goal: 'Define table Studierender with appropriate column definitions.',
      goldNodeIds: ['gold-1', 'gold-2'],
      elicitationMode: 'sql-editor',
      hints: [
        'Use standard SQL syntax: CREATE TABLE Studierender (...)',
        'Ensure you provide a primary key attribute like matrikel_nr INT PRIMARY KEY.'
      ]
    },
    {
      id: 'scene-2',
      order: 2,
      title: 'Scene 2: Row Insertion & Verification',
      narration: 'The first student, Alice, arrives to enroll. Insert her record into the database and retrieve it to verify.',
      goal: 'Insert a valid row into Studierender and write a query to inspect the table.',
      goldNodeIds: ['gold-3', 'gold-4'],
      elicitationMode: 'sql-editor',
      hints: [
        'Use INSERT INTO Studierender VALUES (1001, "Alice", 1);',
        'Verify with SELECT * FROM Studierender;'
      ]
    }
  ],
  goldTree: {
    learnerId: 'gold-author',
    taskId: 'task-001',
    sessionId: 'gold-ref',
    rootId: 'gold-root',
    version: 1,
    prunedNodeIds: [],
    activePath: ['gold-root', 'gold-1', 'gold-2', 'gold-3', 'gold-4'],
    nodes: [
      {
        id: 'gold-root',
        label: 'Problem Specification',
        content: 'Identify requirement to manage student data in SQLite.',
        kind: 'goal',
        status: 'confirmed'
      },
      {
        id: 'gold-1',
        label: 'Identify Entity',
        content: 'Declare student entity as relational table Studierender.',
        kind: 'subgoal',
        status: 'confirmed'
      },
      {
        id: 'gold-2',
        label: 'Create Table Statement',
        content: 'CREATE TABLE Studierender (matrikel_nr INT PRIMARY KEY, name VARCHAR(100), semester INT);',
        kind: 'operator',
        status: 'confirmed'
      },
      {
        id: 'gold-3',
        label: 'Insert Row',
        content: 'INSERT INTO Studierender VALUES (1001, \'Alice\', 1);',
        kind: 'evidence',
        status: 'confirmed'
      },
      {
        id: 'gold-4',
        label: 'Query Verification',
        content: 'SELECT * FROM Studierender;',
        kind: 'operator',
        status: 'confirmed'
      }
    ],
    edges: [
      { from: 'gold-root', to: 'gold-1', relation: 'elaborates' },
      { from: 'gold-1', to: 'gold-2', relation: 'depends-on' },
      { from: 'gold-2', to: 'gold-3', relation: 'depends-on' },
      { from: 'gold-3', to: 'gold-4', relation: 'depends-on' }
    ]
  }
};

export const TASK_ARTIKEL_LIEFERANT_JOIN: Task = {
  id: 'task-002',
  slug: 'artikel-lieferant-join',
  title: 'Relational Join: Artikel & Lieferant',
  domain: 'sql',
  brief: 'A warehouse needs to generate a report matching inventory items with their suppliers.',
  starterState: {
    schemaSql: 'CREATE TABLE Artikel (artikel_id INT PRIMARY KEY, name VARCHAR(100), lieferant_id INT);\nCREATE TABLE Lieferant (lieferant_id INT PRIMARY KEY, firma VARCHAR(100));\n',
    seedSql: 'INSERT INTO Lieferant VALUES (10, \'Logistics Corp\');\nINSERT INTO Artikel VALUES (101, \'Screws\', 10);\n',
    initialQuery: 'SELECT a.name, l.firma FROM Artikel a JOIN Lieferant l ON a.lieferant_id = l.lieferant_id;'
  },
  scenes: [
    {
      id: 'scene-1',
      order: 1,
      title: 'Scene 1: Formulating Foreign Key Relationship',
      narration: 'Verify that foreign key references exist between Artikel and Lieferant before querying.',
      goal: 'Identify common attribute lieferant_id linking the two entities.',
      goldNodeIds: ['gold-join-1'],
      elicitationMode: 'sql-editor',
      hints: ['Check table columns using PRAGMA or schema definition.']
    },
    {
      id: 'scene-2',
      order: 2,
      title: 'Scene 2: Executing Inner Join',
      narration: 'Construct an INNER JOIN query retrieving article name alongside company name.',
      goal: 'Write valid SELECT JOIN query using explicit ON clause.',
      goldNodeIds: ['gold-join-2'],
      elicitationMode: 'sql-editor',
      hints: ['Use SELECT a.name, l.firma FROM Artikel a JOIN Lieferant l ON a.lieferant_id = l.lieferant_id;']
    }
  ],
  goldTree: {
    learnerId: 'gold-author',
    taskId: 'task-002',
    sessionId: 'gold-ref-2',
    rootId: 'gold-root-2',
    version: 1,
    prunedNodeIds: [],
    activePath: ['gold-root-2', 'gold-join-1', 'gold-join-2'],
    nodes: [
      {
        id: 'gold-root-2',
        label: 'Relational Goal',
        content: 'Identify relationship between Artikel and Lieferant tables.',
        kind: 'goal',
        status: 'confirmed'
      },
      {
        id: 'gold-join-1',
        label: 'Identify Join Condition',
        content: 'Relate Artikel.lieferant_id to Lieferant.lieferant_id.',
        kind: 'subgoal',
        status: 'confirmed'
      },
      {
        id: 'gold-join-2',
        label: 'Execute Join Query',
        content: 'SELECT a.name, l.firma FROM Artikel a JOIN Lieferant l ON a.lieferant_id = l.lieferant_id;',
        kind: 'operator',
        status: 'confirmed'
      }
    ],
    edges: [
      { from: 'gold-root-2', to: 'gold-join-1', relation: 'elaborates' },
      { from: 'gold-join-1', to: 'gold-join-2', relation: 'depends-on' }
    ]
  }
};

export const TASKS_REGISTRY: Record<string, Task> = {
  'create-studierender': DEMO_TASK_STUDIERENDER,
  'artikel-lieferant-join': TASK_ARTIKEL_LIEFERANT_JOIN
};
