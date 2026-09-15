import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { GraphResponse, GraphTag } from '../lib/types';

const NEUTRAL_NODE_COLOR = '#4b5563';
const DIMMED_COLOR = '#2d333b';
const SEMANTIC_EDGE_COLOR = '#6b7280';

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
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.get<GraphResponse>('/graph');
        if (!cancelled) setData(result);
      } catch (error) {
        if (!cancelled) showToast('error', getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allTags = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, GraphTag>();
    for (const node of data.nodes) {
      for (const tag of node.tags) map.set(tag.id, tag);
    }
    return Array.from(map.values());
  }, [data]);

  const neighborIds = useMemo(() => {
    if (!data || !hoveredNodeId) return null;
    const ids = new Set<string>([hoveredNodeId]);
    for (const edge of data.edges) {
      const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
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

  const isDimmed = (nodeId: string): boolean => {
    if (!data || selectedTagIds.size === 0) return false;
    const node = data.nodes.find((n) => n.id === nodeId);
    return !node?.tags.some((t) => selectedTagIds.has(t.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
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
          <span className="inline-block w-5 h-0.5" style={{ backgroundColor: '#0acffe' }} />
          shared tag
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

      <div className="flex-1 min-h-0">
        <ForceGraph2D
          graphData={{ nodes: data.nodes as any, links: data.edges as any }}
          nodeId="id"
          nodeLabel="title"
          nodeColor={(node: any) =>
            isDimmed(node.id) ? DIMMED_COLOR : node.tags?.[0] ? tagColor(node.tags[0].id) : NEUTRAL_NODE_COLOR
          }
          linkColor={(link: any) =>
            link.kind === 'tag' && link.shared_tags?.[0] ? tagColor(link.shared_tags[0].id) : SEMANTIC_EDGE_COLOR
          }
          linkLineDash={(link: any) => (link.kind === 'semantic' ? [2, 2] : null)}
          linkWidth={(link: any) => {
            if (!neighborIds) return 1;
            const source = typeof link.source === 'string' ? link.source : link.source.id;
            const target = typeof link.target === 'string' ? link.target : link.target.id;
            return neighborIds.has(source) && neighborIds.has(target) ? 2.5 : 1;
          }}
          onNodeHover={(node: any) => setHoveredNodeId(node?.id ?? null)}
          onNodeClick={(node: any) => navigate(`/item/${node.id}`)}
          backgroundColor="#0a0f14"
        />
      </div>
    </div>
  );
}
