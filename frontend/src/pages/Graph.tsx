import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { GraphNode, GraphResponse, GraphTag } from '../lib/types';

const NEUTRAL_NODE_COLOR = '#4b5563';
const DIMMED_COLOR = '#2d333b';
const SEMANTIC_EDGE_COLOR = '#6b7280';
const LEGEND_TAG_SWATCH_COLOR = '#8b949e';

/** A node as the force-graph runtime sees it (simulation adds x/y). */
interface ForceGraphNode extends GraphNode {
  x?: number;
  y?: number;
}

/**
 * A link as the force-graph runtime sees it: source/target start as id strings
 * and are replaced by node object references once the simulation ingests them.
 */
interface ForceGraphLink {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  kind: 'tag' | 'semantic';
  shared_tags: GraphTag[];
  score?: number;
}

function endpointId(endpoint: string | ForceGraphNode): string {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function tagColor(tagId: string): string {
  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    hash = tagId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export function Graph() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.get<GraphResponse>('/graph');
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err);
          setError(message);
          showToast('error', message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ForceGraph2D defaults width/height to the window size and has no resize
  // handling, so measure the container and pass explicit dimensions.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, error, data]);

  const allTags = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, GraphTag>();
    for (const node of data.nodes) {
      for (const tag of node.tags) map.set(tag.id, tag);
    }
    return Array.from(map.values());
  }, [data]);

  const nodesById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of data?.nodes ?? []) map.set(node.id, node);
    return map;
  }, [data]);

  // Must only change when the fetched data changes: a new graphData object
  // identity re-heats the whole force simulation.
  const graphData = useMemo(
    () => ({ nodes: data?.nodes ?? [], links: data?.edges ?? [] }),
    [data]
  );

  const neighborIds = useMemo(() => {
    if (!data || !hoveredNodeId) return null;
    const ids = new Set<string>([hoveredNodeId]);
    for (const edge of data.edges) {
      const source = endpointId(edge.source);
      const target = endpointId(edge.target);
      if (source === hoveredNodeId) ids.add(target);
      if (target === hoveredNodeId) ids.add(source);
    }
    return ids;
  }, [data, hoveredNodeId]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const isTagFiltered = (nodeId: string): boolean => {
    if (selectedTagIds.size === 0) return false;
    const node = nodesById.get(nodeId);
    return !node?.tags.some((t) => selectedTagIds.has(t.id));
  };

  // A node dims if the tag filter excludes it, or a hover is active and the
  // node is neither the hovered node nor one of its direct neighbors.
  const isDimmed = (nodeId: string): boolean =>
    isTagFiltered(nodeId) || (neighborIds !== null && !neighborIds.has(nodeId));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <Network size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Couldn't load the graph</h3>
          <p className="text-text-muted">{error}</p>
          <p className="text-text-muted mt-2">Please try again in a moment.</p>
        </Card>
      </div>
    );
  }

  if (!data || data.nodes.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <Network size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Not enough items yet</h3>
          <p className="text-text-muted">Add a few more items to start seeing how they connect.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Network size={32} />
          Graph
        </h1>
        <p className="text-text-muted mt-2">
          How your saved items connect, by shared tags and similar content.
        </p>
      </div>

      <div className="flex items-center gap-4 px-6 py-3 text-sm text-text-muted">
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-0.5"
            style={{ backgroundColor: LEGEND_TAG_SWATCH_COLOR }}
          />
          shared tag (colored by tag)
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-0.5"
            style={{ borderTop: `1px dashed ${SEMANTIC_EDGE_COLOR}` }}
          />
          similar content
        </span>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pb-3">
          {allTags.map((tag) => {
            const active = selectedTagIds.has(tag.id);
            const color = tagColor(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity"
                style={{
                  backgroundColor: color,
                  color: '#0a0f14',
                  opacity: active || selectedTagIds.size === 0 ? 1 : 0.4,
                  outline: active ? '2px solid #e6edf3' : 'none',
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0">
        {size.width > 0 && size.height > 0 && (
          <ForceGraph2D
            width={size.width}
            height={size.height}
            graphData={graphData}
            nodeId="id"
            nodeLabel="title"
            nodeColor={(node: ForceGraphNode) =>
              isDimmed(node.id)
                ? DIMMED_COLOR
                : node.tags?.[0]
                  ? tagColor(node.tags[0].id)
                  : NEUTRAL_NODE_COLOR
            }
            linkColor={(link: ForceGraphLink) =>
              link.kind === 'tag' && link.shared_tags?.[0]
                ? tagColor(link.shared_tags[0].id)
                : SEMANTIC_EDGE_COLOR
            }
            linkLineDash={(link: ForceGraphLink) => (link.kind === 'semantic' ? [2, 2] : null)}
            linkLabel={(link: ForceGraphLink) =>
              link.kind === 'semantic'
                ? `similar (${Math.round((link.score ?? 0) * 100)}%)`
                : link.shared_tags.map((t) => t.name).join(', ')
            }
            linkWidth={(link: ForceGraphLink) => {
              if (!hoveredNodeId) return 1;
              const source = endpointId(link.source);
              const target = endpointId(link.target);
              return source === hoveredNodeId || target === hoveredNodeId ? 2.5 : 1;
            }}
            onNodeHover={(node: ForceGraphNode | null) => setHoveredNodeId(node?.id ?? null)}
            onNodeClick={(node: ForceGraphNode) => navigate(`/item/${node.id}`)}
            backgroundColor="#0a0f14"
          />
        )}
      </div>
    </div>
  );
}
