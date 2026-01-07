package com.example.project_iot_auto_watering.ui.setting.adapter

import androidx.recyclerview.widget.DiffUtil
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO

class ScheduleDiffCallBack : DiffUtil.ItemCallback<ScheduleDTO>() {
    override fun areItemsTheSame(
        oldItem: ScheduleDTO,
        newItem: ScheduleDTO
    ): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(
        oldItem: ScheduleDTO,
        newItem: ScheduleDTO
    ): Boolean {
        return oldItem == newItem
    }
}