<?php
// Allow requests from your own pages
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Connect to (or create) a SQLite database file
// PDO = PHP Data Objects — a safe way to talk to databases
$db = new PDO('sqlite:' . __DIR__ . '/views.db');

// Create the table if it doesn't exist yet
$db->exec('CREATE TABLE IF NOT EXISTS views (
  model TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
)');

// Get the model name from the URL: ?model=coke
// filter_input sanitises it — prevents injection attacks
$model = filter_input(INPUT_GET, 'model', FILTER_SANITIZE_STRING);

if ($model && in_array($model, ['coke', 'fanta', 'sprite'])) {

  // INSERT OR IGNORE adds the row if it doesn't exist
  $db->exec("INSERT OR IGNORE INTO views (model, count) VALUES ('$model', 0)");

  // Increment the counter
  $db->exec("UPDATE views SET count = count + 1 WHERE model = '$model'");

  // Return all counts as JSON
  $counts = [];
  foreach ($db->query('SELECT * FROM views') as $row) {
    $counts[$row['model']] = (int)$row['count'];
  }
  echo json_encode(['success' => true, 'counts' => $counts]);

} else {
  echo json_encode(['error' => 'invalid model']);
}
?>