package com.example.project_iot_auto_watering.ui.history.adapter

import androidx.recyclerview.widget.DiffUtil
import com.example.project_iot_auto_watering.data.model.response.IrrigationLog

class LogDiffUtil: DiffUtil.ItemCallback<IrrigationLog>() {
    override fun areItemsTheSame(
        oldItem: IrrigationLog,
        newItem: IrrigationLog
    ): Boolean {
        return oldItem.id==newItem.id
    }

    override fun areContentsTheSame(
        oldItem: IrrigationLog,
        newItem: IrrigationLog
    ): Boolean {
        return oldItem==newItem
    }
}