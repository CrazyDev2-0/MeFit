// Copyright (C) 2016 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR GPL-3.0-only

#ifndef CHART_H
#define CHART_H

#include <QtCharts/QChart>
#include <QtCore/QTimer>

QT_BEGIN_NAMESPACE
class QSplineSeries;
class QValueAxis;
QT_END_NAMESPACE

QT_USE_NAMESPACE


class Chart: public QChart
{
    Q_OBJECT
public:
    Chart(QGraphicsItem *parent = nullptr, Qt::WindowFlags wFlags = {});
    virtual ~Chart();
    QSplineSeries *m_series;
    QValueAxis *m_axisX;
    QValueAxis *m_axisY;

public slots:
    void addPoint(qreal x, qreal y);
    void setXRange(qreal min, qreal max);
    void setYRange(qreal min, qreal max);
};


#endif /* CHART_H */
