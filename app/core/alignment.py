from app.core.embeddings import step_distance

def compute_dtw(S: list[str | list[float]], R: list[str | list[float]]) -> tuple[float, list[tuple[int, int]]]:
    n, m = len(S), len(R)
    if n == 0 or m == 0:
        return 0.0, []

    dist = [[step_distance(S[i], R[j]) for j in range(m)] for i in range(n)]

    cost = [[float('inf')] * m for _ in range(n)]
    cost[0][0] = dist[0][0]

    for j in range(1, m):
        cost[0][j] = cost[0][j-1] + dist[0][j]
    for i in range(1, n):
        cost[i][0] = cost[i-1][0] + dist[i][0]

    for i in range(1, n):
        for j in range(1, m):
            cost[i][j] = dist[i][j] + min(
                cost[i-1][j],
                cost[i][j-1],
                cost[i-1][j-1]
            )

    best_j = min(range(m), key=lambda j: cost[n-1][j]) if n < m else m - 1

    i, j = n - 1, best_j
    path = [(i, j)]
    while i > 0 or (i == 0 and j > 0 and n == m):
        if i == 0:
            j -= 1
        elif j == 0:
            i -= 1
        else:
            min_prev = min(cost[i-1][j-1], cost[i-1][j], cost[i][j-1])
            if min_prev == cost[i-1][j-1]:
                i -= 1
                j -= 1
            elif min_prev == cost[i-1][j]:
                i -= 1
            else:
                j -= 1
        path.append((i, j))

    path.reverse()
    return cost[n-1][best_j], path

def compute_drop_dtw(
    S: list[str | list[float]],
    R: list[str | list[float]],
    drop_cost: float = 0.5
) -> tuple[float, list[tuple[int, int]], list[int]]:
    n, m = len(S), len(R)
    if n == 0 or m == 0:
        return 0.0, [], list(range(n))

    dist = [[step_distance(S[i], R[j]) for j in range(m)] for i in range(n)]

    cost = [[float('inf')] * m for _ in range(n)]
    parent = [[None] * m for _ in range(n)]

    cost[0][0] = dist[0][0]
    for j in range(1, m):
        cost[0][j] = cost[0][j-1] + dist[0][j]
        parent[0][j] = (0, j-1, False)

    for i in range(1, n):
        match_c = dist[i][0] + min(cost[i-1][0], i * drop_cost)
        drop_c = cost[i-1][0] + drop_cost

        if drop_c < match_c:
            cost[i][0] = drop_c
            parent[i][0] = (i-1, 0, True)
        else:
            cost[i][0] = match_c
            parent[i][0] = (i-1, 0, False)

    for i in range(1, n):
        for j in range(1, m):
            match_c = dist[i][j] + min(
                cost[i-1][j-1],
                cost[i-1][j],
                cost[i][j-1]
            )
            drop_c = cost[i-1][j] + drop_cost

            if drop_c <= match_c:
                cost[i][j] = drop_c
                parent[i][j] = (i-1, j, True)
            else:
                cost[i][j] = match_c
                min_p = min(cost[i-1][j-1], cost[i-1][j], cost[i][j-1])
                if min_p == cost[i-1][j-1]:
                    parent[i][j] = (i-1, j-1, False)
                elif min_p == cost[i-1][j]:
                    parent[i][j] = (i-1, j, False)
                else:
                    parent[i][j] = (i, j-1, False)

    best_j = min(range(m), key=lambda j: cost[n-1][j]) if n < m else m - 1

    curr_i, curr_j = n - 1, best_j
    path = []
    dropped = []

    while curr_i >= 0 and curr_j >= 0:
        p = parent[curr_i][curr_j]
        if p is None:
            path.append((curr_i, curr_j))
            break
        prev_i, prev_j, is_drop = p
        if is_drop:
            dropped.append(curr_i)
        else:
            path.append((curr_i, curr_j))
        curr_i, curr_j = prev_i, prev_j

    path.reverse()
    dropped.reverse()
    return cost[n-1][best_j], path, dropped
