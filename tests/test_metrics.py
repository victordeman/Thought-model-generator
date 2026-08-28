import pytest
from app.core.embeddings import embed, cosine_similarity, step_distance
from app.core.alignment import compute_dtw, compute_drop_dtw
from app.core.metrics import compute_trajectory_metrics, predict_next_step

def test_embeddings_and_cosine():
    v1 = embed("CREATE TABLE Studierender (id INT PRIMARY KEY);")
    v2 = embed("CREATE TABLE Studierender (id INT PRIMARY KEY);")
    v3 = embed("SELECT * FROM Wein;")

    assert cosine_similarity(v1, v2) > 0.99
    assert cosine_similarity(v1, v3) < 0.5
    assert step_distance("A", "A") == pytest.approx(0.0, abs=1e-5)

def test_dtw_alignment():
    S = ["create table students", "insert into students values (1, 'Alice')"]
    R = ["identify entity students", "create table students", "insert row into students"]

    cost, path = compute_dtw(S, R)
    assert len(path) >= len(S)

def test_drop_dtw():
    S = ["create table students", "select * from wein", "insert row"]
    R = ["create table students", "insert row"]

    cost, path, dropped = compute_drop_dtw(S, R, drop_cost=0.5)
    assert len(dropped) >= 0

def test_compute_trajectory_metrics():
    S = ["create table studierender", "select * from wein", "insert into studierender"]
    R = ["create table studierender", "insert into studierender", "query studierender"]

    metrics = compute_trajectory_metrics(S, R)
    assert metrics["progress_final"] >= 0

def test_predict_next_step():
    S = ["create table studierender"]
    R = ["create table studierender", "insert into studierender", "query studierender"]

    pred = predict_next_step(S, R, proposed_next="insert into studierender")
    assert pred["expected_next_index"] >= 0
