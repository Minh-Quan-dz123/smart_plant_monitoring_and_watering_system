package com.example.project_iot_auto_watering.ui.history.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.ListAdapter
import com.example.project_iot_auto_watering.data.model.response.IrrigationLog
import com.example.project_iot_auto_watering.databinding.ItemHistoryBinding

class LogAdapter(private val listener:()->Unit) : ListAdapter<IrrigationLog, LogViewHolder>(LogDiffUtil()) {
    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): LogViewHolder {
        val view = ItemHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return LogViewHolder(view)
    }

    override fun onBindViewHolder(
        holder: LogViewHolder,
        position: Int
    ) {
        val log = getItem(position)
        holder.bind(log)
        holder.binding.imgDelete.setOnClickListener {
            listener()
        }
    }
}
