from app.core.embeddings import step_distance
from app.core.alignment import compute_dtw, compute_drop_dtw

def compute_trajectory_metrics(
    S: list[str],
    R: list[str],
    alpha: float = 0.7,
    beta: float = 0.3,
    drop_cost: float = 0.5,
    use_drop_dtw: bool = True
) -> dict:
    n, m = len(S), len(R)
    if n == 0 or m == 0:
        return {
            "d_align": 0.0,
            "mean_d_step": 0.0,
            "d_trajectory": 0.0,
            "progress_final": 0.0,
            "delta_pi": [],
            "matched_indices": [],
            "dropped_indices": [],
            "flags": []
        }

    d_steps = [step_distance(S[i], S[i+1]) for i in range(n - 1)] if n > 1 else [0.0]
    mean_d_step = sum(d_steps) / len(d_steps) if d_steps else 0.0

    if use_drop_dtw:
        cost, path, dropped_indices = compute_drop_dtw(S, R, drop_cost=drop_cost)
    else:
        cost, path = compute_dtw(S, R)
        dropped_indices = []

    matched_indices = [-1] * n
    for sj_idx, rk_idx in path:
        if sj_idx not in dropped_indices:
            matched_indices[sj_idx] = rk_idx

    delta_pi = []
    flags = []

    for j in range(n):
        if j in dropped_indices:
            delta_pi.append(1.0)
            flags.append("dropped_outlier")
        else:
            matched_r = matched_indices[j]
            if matched_r >= 0:
                dev = step_distance(S[j], R[matched_r])
                delta_pi.append(dev)
                if dev > 0.6:
                    flags.append("off_path")
            else:
                delta_pi.append(1.0)

    for ds in d_steps:
        if ds > 0.7:
            flags.append("large_jump")

    if len(set(matched_indices)) < len([x for x in matched_indices if x >= 0]) and n >= 3:
        flags.append("productive_struggle")

    d_align = cost / max(n, m)
    d_trajectory = alpha * d_align + beta * mean_d_step

    valid_matched = [idx for idx in matched_indices if idx >= 0]
    last_matched = max(valid_matched, default=-1) if valid_matched else -1
    progress_final = min(1.0, (last_matched + 1) / float(m)) if m > 0 else 0.0

    return {
        "d_align": d_align,
        "mean_d_step": mean_d_step,
        "d_trajectory": d_trajectory,
        "progress_final": progress_final,
        "delta_pi": delta_pi,
        "matched_indices": matched_indices,
        "dropped_indices": dropped_indices,
        "flags": list(set(flags))
    }

def predict_next_step(
    S: list[str],
    R: list[str],
    proposed_next: str
) -> dict:
    m = len(R)
    if m == 0:
        return {"expected_next_index": 0, "expected_next_node": "", "delta_next": 0.0}

    metrics = compute_trajectory_metrics(S, R)
    matched = metrics["matched_indices"]
    valid_matched = [idx for idx in matched if idx >= 0]
    last_matched = max(valid_matched, default=-1) if valid_matched else -1

    expected_idx = min(last_matched + 1, m - 1)
    expected_node = R[expected_idx]

    delta_next = step_distance(proposed_next, expected_node) if proposed_next else 1.0

    return {
        "expected_next_index": expected_idx,
        "expected_next_node": expected_node,
        "delta_next": delta_next,
        "is_on_track": delta_next < 0.4
    }
