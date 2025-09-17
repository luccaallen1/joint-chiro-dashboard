import { TrendingUp, TrendingDown, Minus, Calendar, Target, MessageSquare, BarChart3 } from 'lucide-react';

const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'primary' }) => {
  const getTrendIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="h-4 w-4" />;
    if (changeType === 'decrease') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendClass = () => {
    if (changeType === 'increase') return 'trend-up';
    if (changeType === 'decrease') return 'trend-down';
    return 'trend-neutral';
  };

  const getIconColor = () => {
    switch (color) {
      case 'success':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-primary-600';
    }
  };

  return (
    <div className="metric-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="metric-card-header">{title}</div>
          <div className="metric-card-value">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change && (
            <div className={`trend-indicator ${getTrendClass()}`}>
              {getTrendIcon()}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 ${getIconColor()}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const MetricsCards = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Bookings',
      value: data?.totalBookings || 0,
      change: data?.bookingsChange || '+0%',
      changeType: data?.bookingsChangeType || 'neutral',
      icon: Calendar,
      color: 'primary'
    },
    {
      title: 'Leads Created',
      value: data?.totalLeads || 0,
      change: data?.leadsChange || '+0%',
      changeType: data?.leadsChangeType || 'neutral',
      icon: Target,
      color: 'success'
    },
    {
      title: 'Engaged Conversations',
      value: data?.engagedConversations || 0,
      change: data?.engagedChange || '+0%',
      changeType: data?.engagedChangeType || 'neutral',
      icon: MessageSquare,
      color: 'warning'
    },
    {
      title: 'Conversion Rate',
      value: data?.conversionRate || '0%',
      change: data?.conversionChange || '+0%',
      changeType: data?.conversionChangeType || 'neutral',
      icon: BarChart3,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
};

export default MetricsCards;